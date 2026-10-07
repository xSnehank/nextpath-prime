"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/api";

const STUDENT_QUESTIONS: Question[] = [
  { id: "s1", audience: "student", category: "aptitude", text: "I enjoy solving puzzles and logical problems.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s2", audience: "student", category: "aptitude", text: "I can easily understand graphs and data charts.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s3", audience: "student", category: "aptitude", text: "I am comfortable working with numbers and calculations.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s4", audience: "student", category: "aptitude", text: "I can explain complex ideas clearly to others.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s5", audience: "student", category: "aptitude", text: "I enjoy writing essays or stories.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s6", audience: "student", category: "aptitude", text: "I pay close attention to details in my work.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s7", audience: "student", category: "aptitude", text: "I can quickly spot patterns in information.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s8", audience: "student", category: "aptitude", text: "I am comfortable using computers and software.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s9", audience: "student", category: "aptitude", text: "I like working with my hands — building or fixing things.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s10", audience: "student", category: "aptitude", text: "I enjoy performing, presenting, or being on stage.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s11", audience: "student", category: "interest", text: "Which subject excites you the most?", type: "choice", options: ["Mathematics", "Science", "English / Languages", "Social Studies", "Computer Science", "Arts & Design", "Commerce", "Physical Education"] },
  { id: "s12", audience: "student", category: "interest", text: "I would rather spend a free hour…", type: "choice", options: ["Coding a small project", "Drawing or designing", "Reading about current events", "Conducting a science experiment", "Playing a sport", "Writing a blog post", "Learning about money and markets", "Volunteering for a cause"] },
  { id: "s13", audience: "student", category: "interest", text: "I enjoy learning about how businesses work.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s14", audience: "student", category: "interest", text: "I am curious about how the human body works.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s15", audience: "student", category: "interest", text: "I like exploring new places and cultures.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s16", audience: "student", category: "interest", text: "I want to build things that people use every day.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s17", audience: "student", category: "interest", text: "I follow news about technology and startups.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s18", audience: "student", category: "interest", text: "I enjoy teaching or mentoring younger students.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s19", audience: "student", category: "interest", text: "I am interested in law, policy, or governance.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s20", audience: "student", category: "interest", text: "I want to create visual content — videos, animations, or graphics.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s21", audience: "student", category: "thinking_style", text: "When solving a problem, I prefer to…", type: "choice", options: ["Break it into small logical steps", "Visualise the big picture first", "Discuss it with others", "Experiment and learn from mistakes"] },
  { id: "s22", audience: "student", category: "thinking_style", text: "I am more motivated by…", type: "choice", options: ["Achieving a personal goal", "Helping others succeed", "Being recognised by peers", "Learning something new"] },
  { id: "s23", audience: "student", category: "thinking_style", text: "I prefer working…", type: "choice", options: ["Alone with full focus", "In a small team", "In a large group", "Alternating solo and team"] },
  { id: "s24", audience: "student", category: "thinking_style", text: "When I hit a dead-end, I usually…", type: "choice", options: ["Try a completely new approach", "Research more before trying again", "Ask someone for help", "Take a break and revisit later"] },
  { id: "s25", audience: "student", category: "thinking_style", text: "I handle pressure by…", type: "choice", options: ["Making a to-do list", "Staying calm and adapting", "Seeking support from friends/family", "Channeling it into harder work"] },
  { id: "s26", audience: "student", category: "thinking_style", text: "I am comfortable with taking risks on new ideas.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s27", audience: "student", category: "thinking_style", text: "I prefer tasks with clear right/wrong answers over open-ended ones.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s28", audience: "student", category: "thinking_style", text: "I can stay focused on one task for a long time.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s29", audience: "student", category: "thinking_style", text: "I enjoy competitions and challenges.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
  { id: "s30", audience: "student", category: "thinking_style", text: "I often come up with creative or unusual solutions.", type: "likert", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
];
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  Pause,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function StudentAssessmentPage() {
  const router = useRouter();
  const questions: Question[] = STUDENT_QUESTIONS;
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number | string>>({});
  const [showJumpGrid, setShowJumpGrid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");

  // Load saved progress on mount (Resume feature)
  React.useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem("prism_student_answers");
      const savedIndex = localStorage.getItem("prism_student_current_index");

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
      if (savedIndex) {
        const parsed = parseInt(savedIndex, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < totalQuestions) {
          setCurrentIndex(parsed);
          setStatusMessage("Resumed from previous session");
        }
      }
    } catch (e) {
      console.warn("Could not load saved progress:", e);
    }
  }, [totalQuestions]);

  // Auto-save on every answer or index change (Pause & Resume)
  const saveProgress = (newAnswers: Record<string, number | string>, newIdx: number) => {
    try {
      localStorage.setItem("prism_student_answers", JSON.stringify(newAnswers));
      localStorage.setItem("prism_student_current_index", newIdx.toString());
    } catch (e) {
      console.warn("Could not save progress:", e);
    }
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (value: number | string) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);
    saveProgress(updated, currentIndex);

    // Auto-advance after 300ms if not on the last question
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          saveProgress(updated, next);
          return next;
        });
      }, 350);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      saveProgress(answers, next);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      saveProgress(answers, prev);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Mark student assessment completed
      localStorage.setItem("prism_student_completed", "true");
      localStorage.setItem("prism_student_answers", JSON.stringify(answers));

      // Check if parent has also completed
      const parentCompleted = localStorage.getItem("prism_parent_completed");
      if (parentCompleted === "true") {
        router.push("/dashboard");
      } else {
        // Invite parent to complete their part
        router.push("/parent/join");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "aptitude":
        return { variant: "default" as const, text: "Aptitude & Logic" };
      case "interest":
        return { variant: "cyan" as const, text: "Career Interest" };
      case "thinking_style":
        return { variant: "warning" as const, text: "Cognitive Style" };
      default:
        return { variant: "secondary" as const, text: cat };
    }
  };

  const catConfig = getCategoryColor(currentQ.category);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-4 relative z-10">
        {/* Top Progress & Header Bar */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={catConfig.variant}>{catConfig.text}</Badge>
              <span className="text-slate-400 font-medium">
                Question <strong className="text-white">{currentIndex + 1}</strong> of {totalQuestions}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-mono font-semibold">
                {answeredCount}/{totalQuestions} Answered
              </span>
              <button
                onClick={() => setShowJumpGrid(!showJumpGrid)}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
              >
                {showJumpGrid ? "Hide Grid" : "Jump to Q"}
              </button>
            </div>
          </div>

          <Progress value={currentIndex + 1} max={totalQuestions} className="h-2" />

          {statusMessage && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
              <Clock className="h-3 w-3" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Question Quick Jump Modal / Drawer */}
        {showJumpGrid && (
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Assessment Question Navigator</span>
              <span className="text-slate-400">Click any number to jump</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowJumpGrid(false);
                      saveProgress(answers, idx);
                    }}
                    className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all ${
                      isCurrent
                        ? "bg-violet-600 text-white ring-2 ring-violet-400"
                        : isAnswered
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Question Card (1 question per screen) */}
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl min-h-[340px] flex flex-col justify-between">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                ID #{currentQ.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Brain className="h-3.5 w-3.5 text-violet-400" />
                <span>Deterministic Scoring</span>
              </div>
            </div>

            <CardTitle className="text-xl sm:text-2xl font-semibold text-white leading-snug">
              {currentQ.text}
            </CardTitle>
          </CardHeader>

          {/* Interactive Answer Input */}
          <CardContent className="space-y-3">
            {/* 5-Point Likert Scale (Standard) */}
            {currentQ.type === "likert" && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
                {(currentQ.options || ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]).map(
                  (opt, i) => {
                    const value = i + 1; // 1 to 5
                    const isSelected = currentAnswer === value;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(value)}
                        className={`p-3.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-gradient-to-b from-violet-600 to-indigo-600 border-violet-400 text-white shadow-lg shadow-violet-600/30 scale-[1.02]"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:border-white/20"
                        }`}
                      >
                        <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-white">
                          {value}
                        </span>
                        <span className="leading-tight">{opt}</span>
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {/* Multiple Choice Options */}
            {currentQ.type === "choice" && currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`p-3.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-400 text-white shadow-lg shadow-violet-600/30"
                          : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:border-white/20"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* Navigation Controls */}
          <CardFooter className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="glow"
                  size="sm"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <span>{isSubmitting ? "Compiling..." : "Submit Assessment"}</span>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Pause & Resume hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="flex items-center gap-1.5">
            <Pause className="h-3 w-3 text-slate-400" />
            Automatic pause &amp; resume enabled via local storage
          </span>
          <button
            onClick={() => {
              if (confirm("Reset assessment answers?")) {
                setAnswers({});
                setCurrentIndex(0);
                localStorage.removeItem("prism_student_answers");
                localStorage.removeItem("prism_student_current_index");
              }
            }}
            className="hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Answers
          </button>
        </div>
      </div>
    </div>
  );
}
