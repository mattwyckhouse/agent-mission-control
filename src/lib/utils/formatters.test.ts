import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelativeTime,
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatCompact,
  formatPercent,
  formatBytes,
  formatDuration,
  truncate,
  capitalize,
  titleCase,
  slugify,
  pluralize,
} from "./formatters";

describe("formatters", () => {
  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-02-03T10:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'just now' for very recent times", () => {
      const date = new Date("2026-02-03T09:59:30Z");
      expect(formatRelativeTime(date)).toBe("just now");
    });

    it("returns minutes ago", () => {
      const date = new Date("2026-02-03T09:55:00Z");
      expect(formatRelativeTime(date)).toBe("5m ago");
    });

    it("returns hours ago", () => {
      const date = new Date("2026-02-03T07:00:00Z");
      expect(formatRelativeTime(date)).toBe("3h ago");
    });

    it("returns days ago", () => {
      const date = new Date("2026-02-01T10:00:00Z");
      expect(formatRelativeTime(date)).toBe("2d ago");
    });

    it("returns weeks ago", () => {
      const date = new Date("2026-01-20T10:00:00Z");
      expect(formatRelativeTime(date)).toBe("2w ago");
    });
  });

  describe("formatDate", () => {
    it("formats date correctly", () => {
      // Use explicit time to avoid timezone issues
      const date = new Date("2026-02-03T12:00:00");
      const result = formatDate(date);
      expect(result).toContain("Feb");
      expect(result).toContain("2026");
    });

    it("accepts string input", () => {
      expect(formatDate("2026-02-03T12:00:00")).toContain("Feb");
    });
  });

  describe("formatNumber", () => {
    it("adds commas to large numbers", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("handles small numbers", () => {
      expect(formatNumber(42)).toBe("42");
    });
  });

  describe("formatCurrency", () => {
    it("formats as USD by default", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
      expect(result).toContain("$");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatCompact", () => {
    it("handles small numbers", () => {
      expect(formatCompact(999)).toBe("999");
    });

    it("formats thousands", () => {
      expect(formatCompact(1500)).toBe("1.5K");
    });

    it("formats millions", () => {
      expect(formatCompact(2500000)).toBe("2.5M");
    });

    it("formats billions", () => {
      expect(formatCompact(3500000000)).toBe("3.5B");
    });
  });

  describe("formatPercent", () => {
    it("formats as percentage", () => {
      expect(formatPercent(0.45)).toBe("45%");
    });

    it("supports decimal places", () => {
      expect(formatPercent(0.456, 1)).toBe("45.6%");
    });
  });

  describe("formatBytes", () => {
    it("handles zero", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("formats bytes", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("formats kilobytes", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
      expect(formatBytes(1572864)).toBe("1.5 MB");
    });
  });

  describe("formatDuration", () => {
    it("formats seconds", () => {
      expect(formatDuration(45000)).toBe("45s");
    });

    it("formats minutes and seconds", () => {
      expect(formatDuration(150000)).toBe("2m 30s");
    });

    it("formats hours and minutes", () => {
      expect(formatDuration(9000000)).toBe("2h 30m");
    });

    it("formats days and hours", () => {
      expect(formatDuration(90000000)).toBe("1d 1h");
    });
  });

  describe("truncate", () => {
    it("returns original if short enough", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
    });

    it("truncates with ellipsis", () => {
      expect(truncate("Hello World!", 8)).toBe("Hello...");
    });
  });

  describe("capitalize", () => {
    it("capitalizes first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("titleCase", () => {
    it("converts to title case", () => {
      expect(titleCase("hello world")).toBe("Hello World");
    });

    it("handles mixed case", () => {
      expect(titleCase("HELLO WORLD")).toBe("Hello World");
    });
  });

  describe("slugify", () => {
    it("converts to slug", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
    });

    it("handles multiple spaces", () => {
      expect(slugify("hello   world")).toBe("hello-world");
    });

    it("handles special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });
  });

  describe("pluralize", () => {
    it("returns singular for 1", () => {
      expect(pluralize("task", 1)).toBe("task");
    });

    it("returns plural for other counts", () => {
      expect(pluralize("task", 0)).toBe("tasks");
      expect(pluralize("task", 2)).toBe("tasks");
      expect(pluralize("task", 100)).toBe("tasks");
    });
  });
});
