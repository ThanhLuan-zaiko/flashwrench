import { describe, expect, test } from "bun:test";
import { HOME_FAQ } from "@/components/home/faq/home-faq.content";

describe("HOME_FAQ", () => {
  test("every item has a question and an answer", () => {
    for (const item of HOME_FAQ) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  test("questions are unique, so the rows have distinct keys", () => {
    const questions = HOME_FAQ.map((item) => item.question);
    expect(new Set(questions).size).toBe(questions.length);
  });
});
