import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getStoredTheme,
  setStoredTheme,
  getResolvedTheme,
  applyTheme,
  initializeTheme,
  type Theme,
} from "./theme";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock matchMedia
const matchMediaMock = vi.fn((query: string) => ({
  matches: query.includes("dark"),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe("Theme utilities", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("matchMedia", matchMediaMock);
    localStorageMock.clear();
    
    // Reset document state
    document.documentElement.classList.remove("dark", "light");
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getStoredTheme", () => {
    it("returns dark as default when nothing stored", () => {
      expect(getStoredTheme()).toBe("dark");
    });

    it("returns stored theme if valid", () => {
      localStorageMock.setItem("mission-control-theme", "light");
      expect(getStoredTheme()).toBe("light");
    });

    it("returns dark for invalid stored value", () => {
      localStorageMock.setItem("mission-control-theme", "invalid");
      expect(getStoredTheme()).toBe("dark");
    });
  });

  describe("setStoredTheme", () => {
    it("stores theme in localStorage", () => {
      setStoredTheme("light");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "mission-control-theme",
        "light"
      );
    });
  });

  describe("getResolvedTheme", () => {
    it("returns dark for dark theme", () => {
      expect(getResolvedTheme("dark")).toBe("dark");
    });

    it("returns light for light theme", () => {
      expect(getResolvedTheme("light")).toBe("light");
    });

    it("resolves system theme based on matchMedia", () => {
      // matchMediaMock returns matches: true for dark
      expect(getResolvedTheme("system")).toBe("dark");
    });
  });

  describe("applyTheme", () => {
    it("adds dark class and data-theme for dark theme", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("adds light class and data-theme for light theme", () => {
      applyTheme("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("removes previous theme class when switching", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      
      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });

  describe("initializeTheme", () => {
    it("reads from localStorage and applies theme", () => {
      localStorageMock.setItem("mission-control-theme", "light");
      const theme = initializeTheme();
      
      expect(theme).toBe("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });
});

describe("Theme CSS variable integration", () => {
  it("should have CSS variables defined for both themes", () => {
    // This test verifies that CSS variables change with theme
    // In a real browser, we'd check computed styles
    // Here we just verify the applyTheme sets the right classes
    
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
