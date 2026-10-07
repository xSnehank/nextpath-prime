"""Thin routers: check who is calling, validate input, call a service (or serve a mock), return a schema."""

from app.api import analyze, auth, careers, consent, demo, domains, explain, health, me, profile, questions, responses, results

ROUTERS = [
    health.router,
    auth.router,
    me.router,
    profile.router,
    domains.router,
    questions.router,
    responses.router,
    consent.router,
    analyze.router,
    results.router,
    explain.router,
    careers.router,
    demo.router,
]
