"""Build the PRISM database from scratch on a throwaway PostgreSQL and run the db tests.

    python db/scripts/check_db.py           # fails if db/schema.sql is out of date
    python db/scripts/check_db.py --write   # also regenerates db/schema.sql

Steps: Supabase stand-in (tests/supabase_shim.sql), every migration, the seeds twice (they must be re-runnable),
then tests/test_*.sql, then a schema snapshot.

Needs the PostgreSQL 15+ command-line tools (initdb, pg_ctl, psql, pg_dump), found in PG_BIN, on PATH, or in
C:\\Program Files\\PostgreSQL\\<version>\\bin. Your own databases are never touched: the server runs from a temp
folder, listens only on 127.0.0.1, needs no password, and is deleted at the end. Standard library only.
"""

import argparse
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

DB_DIR = Path(__file__).resolve().parents[1]
SNAPSHOT = DB_DIR / "schema.sql"
DATABASE = "prism_check"
TOOLS = ("initdb", "pg_ctl", "psql", "pg_dump")
SNAPSHOT_HEADER = (
    "-- GENERATED from db/migrations by db/scripts/check_db.py --write (pg_dump {major}). Do not edit.\n"
    "-- A readable snapshot of the public schema; the migrations are the source of truth.\n\n"
)


class CheckFailed(Exception):
    pass


def _exe(bin_dir: Path, tool: str) -> Path:
    return bin_dir / (f"{tool}.exe" if os.name == "nt" else tool)


def find_bin_dir() -> Path:
    candidates: list[Path] = []
    if os.environ.get("PG_BIN"):
        candidates.append(Path(os.environ["PG_BIN"]))
    if found := shutil.which("initdb"):
        candidates.append(Path(found).parent)
    windows_root = Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "PostgreSQL"
    if windows_root.is_dir():
        versions = sorted(windows_root.iterdir(), key=lambda p: [int(x) for x in re.findall(r"\d+", p.name)], reverse=True)
        candidates += [version / "bin" for version in versions]
    for bin_dir in candidates:
        if all(_exe(bin_dir, tool).exists() for tool in TOOLS):
            return bin_dir
    raise CheckFailed("PostgreSQL command-line tools not found. Install PostgreSQL 15+ or set PG_BIN to its bin folder.")


def run(command: list[str], env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class ThrowawayServer:
    def __init__(self, bin_dir: Path, root: Path) -> None:
        self.bin_dir = bin_dir
        self.data = root / "data"
        self.log = root / "server.log"
        self.root = root
        self.port = free_port()
        self.env = {
            **os.environ,
            "PGHOST": "127.0.0.1",
            "PGPORT": str(self.port),
            "PGUSER": "postgres",
            "PGDATABASE": DATABASE,
            "PGCLIENTENCODING": "UTF8",  # the seeds contain ₹; without this, Windows psql reads them as WIN1252
        }
        self.env.pop("PGPASSWORD", None)

    def tool(self, name: str) -> str:
        return str(_exe(self.bin_dir, name))

    def start(self) -> None:
        result = run([self.tool("initdb"), "-D", str(self.data), "-U", "postgres", "-A", "trust", "-E", "UTF8", "--no-locale"])
        if result.returncode:
            raise CheckFailed(f"initdb failed:\n{result.stderr or result.stdout}")
        options = f"-p {self.port} -c listen_addresses=127.0.0.1 -c fsync=off -c full_page_writes=off"
        if os.name != "nt":
            options += f" -c unix_socket_directories={self.root}"
        # No captured pipes here: the server pg_ctl starts would inherit them and keep them open, so
        # waiting for pg_ctl's output would never end (on Windows). The server writes to its log file instead.
        started = subprocess.run(
            [self.tool("pg_ctl"), "-D", str(self.data), "-l", str(self.log), "-o", options, "-w", "-t", "60", "start"],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if started.returncode:
            log = self.log.read_text(encoding="utf-8", errors="replace") if self.log.exists() else ""
            raise CheckFailed(f"the throwaway server didn't start; its log:\n{log}")
        result = run([self.tool("psql"), "-X", "-q", "-d", "postgres", "-c", f"CREATE DATABASE {DATABASE}"], self.env)
        if result.returncode:
            raise CheckFailed(f"couldn't create the test database:\n{result.stderr}")

    def stop(self) -> None:
        if self.data.exists():
            run([self.tool("pg_ctl"), "-D", str(self.data), "-m", "immediate", "-w", "stop"])

    def psql(self, file: Path, *, single_transaction: bool) -> list[str]:
        """Run one SQL file; returns the NOTICE lines it printed. Raises on the first error."""
        command = [self.tool("psql"), "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", str(file)]
        if single_transaction:
            command.insert(1, "-1")
        result = run(command, self.env)
        if result.returncode:
            raise CheckFailed(f"{file.relative_to(DB_DIR)} failed:\n{result.stderr or result.stdout}")
        return [line.split("NOTICE:", 1)[1].strip() for line in result.stderr.splitlines() if "NOTICE:" in line]

    def dump_schema(self) -> tuple[str, int]:
        version = run([self.tool("pg_dump"), "--version"]).stdout
        major = int(re.search(r"(\d+)\.\d+", version).group(1))
        result = run(
            [self.tool("pg_dump"), "--schema-only", "--no-owner", "--no-privileges", "--schema=public"], self.env
        )
        if result.returncode:
            raise CheckFailed(f"pg_dump failed:\n{result.stderr}")
        return SNAPSHOT_HEADER.format(major=major) + normalise(result.stdout), major


def normalise(dump: str) -> str:
    """Drop the lines that change on every run or between machines."""
    kept = [
        line.rstrip()
        for line in dump.splitlines()
        if not line.startswith(("\\restrict", "\\unrestrict", "-- Dumped from", "-- Dumped by"))
    ]
    text = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
    return text + "\n"


def remove_tree(path: Path) -> None:
    for _ in range(10):  # Windows may hold the data files for a moment after the server stops
        shutil.rmtree(path, ignore_errors=True)
        if not path.exists():
            return
        time.sleep(0.5)


@contextmanager
def throwaway_database(*, seed: bool = True) -> Iterator[str]:
    """A fresh database built from the shim, the migrations and (by default) the seeds; yields its URL.

    The backend's live-mode tests use this, so they run against the real schema. Raises CheckFailed when
    the PostgreSQL tools can't be found.
    """
    root = Path(tempfile.mkdtemp(prefix="prism-db-test-"))
    server: ThrowawayServer | None = None
    try:
        server = ThrowawayServer(find_bin_dir(), root)
        server.start()
        server.psql(DB_DIR / "tests" / "supabase_shim.sql", single_transaction=True)
        for migration in sorted((DB_DIR / "migrations").glob("*.sql")):
            server.psql(migration, single_transaction=True)
        if seed:
            server.psql(DB_DIR / "seed" / "00_run_all.sql", single_transaction=True)
        yield f"postgresql://postgres@127.0.0.1:{server.port}/{DATABASE}"
    finally:
        if server:
            server.stop()
        remove_tree(root)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--write", action="store_true", help="regenerate db/schema.sql")
    args = parser.parse_args()
    sys.stdout.reconfigure(line_buffering=True)  # show each step as it happens, even when piped

    root = Path(tempfile.mkdtemp(prefix="prism-db-check-"))
    server: ThrowawayServer | None = None
    try:
        bin_dir = find_bin_dir()
        version = run([str(_exe(bin_dir, "psql")), "--version"]).stdout.strip()
        print(f"Using {version} from {bin_dir}")

        server = ThrowawayServer(bin_dir, root)
        server.start()
        print(f"[1/6] throwaway server on 127.0.0.1:{server.port}")

        server.psql(DB_DIR / "tests" / "supabase_shim.sql", single_transaction=True)
        print("[2/6] Supabase stand-in: tests/supabase_shim.sql")

        migrations = sorted((DB_DIR / "migrations").glob("*.sql"))
        for migration in migrations:
            server.psql(migration, single_transaction=True)
        print(f"[3/6] migrations: {', '.join(m.name for m in migrations)}")

        runner = DB_DIR / "seed" / "00_run_all.sql"
        for _ in range(2):
            server.psql(runner, single_transaction=True)
        print("[4/6] seeds, run twice: seed/00_run_all.sql")

        tests = sorted((DB_DIR / "tests").glob("test_*.sql"))
        notices: list[str] = []
        for test in tests:
            notices += server.psql(test, single_transaction=False)
        print(f"[5/6] tests: {', '.join(t.name for t in tests)}")
        for notice in notices:
            print(f"      {notice}")

        snapshot, major = server.dump_schema()
        if args.write:
            SNAPSHOT.write_text(snapshot, encoding="utf-8", newline="\n")
            print("[6/6] wrote db/schema.sql")
        else:
            current = SNAPSHOT.read_text(encoding="utf-8") if SNAPSHOT.exists() else ""
            recorded = re.search(r"\(pg_dump (\d+)\)", current)
            if recorded and int(recorded.group(1)) != major:
                print(f"[6/6] skipped: db/schema.sql was made with pg_dump {recorded.group(1)}, this is {major}")
            elif current.replace("\r\n", "\n") != snapshot:
                raise CheckFailed("db/schema.sql is out of date: run python db/scripts/check_db.py --write")
            else:
                print("[6/6] db/schema.sql is up to date")
    except CheckFailed as failure:
        print(f"\nFAILED: {failure}", file=sys.stderr)
        return 1
    finally:
        if server:
            server.stop()
        remove_tree(root)

    print("All database checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
