import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers keydown event listener on mount", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { combo: { key: "k", meta: true }, handler }
    ]));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("removes keydown event listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts([
      { combo: { key: "k", meta: true }, handler }
    ]));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("triggers handler on matching key combo", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { combo: { key: "k" }, handler }
    ]));

    // Get the registered handler
    const keydownHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    
    // Simulate keydown
    const event = new KeyboardEvent("keydown", { key: "k" });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    keydownHandler(event);

    expect(handler).toHaveBeenCalled();
  });

  it("does not trigger handler for non-matching key", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { combo: { key: "k" }, handler }
    ]));

    const keydownHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    
    const event = new KeyboardEvent("keydown", { key: "j" });
    keydownHandler(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("respects modifier keys", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { combo: { key: "k", ctrl: true }, handler }
    ]));

    const keydownHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    
    // Without ctrl - should not trigger
    const eventNoCtrl = new KeyboardEvent("keydown", { key: "k", ctrlKey: false });
    keydownHandler(eventNoCtrl);
    expect(handler).not.toHaveBeenCalled();

    // With ctrl - should trigger
    const eventWithCtrl = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    Object.defineProperty(eventWithCtrl, "preventDefault", { value: vi.fn() });
    keydownHandler(eventWithCtrl);
    expect(handler).toHaveBeenCalled();
  });

  it("supports multiple combos for same handler", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { 
        combo: [
          { key: "k", ctrl: true },
          { key: "k", meta: true }
        ],
        handler 
      }
    ]));

    const keydownHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;
    
    // Either should work
    const event1 = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    Object.defineProperty(event1, "preventDefault", { value: vi.fn() });
    keydownHandler(event1);
    expect(handler).toHaveBeenCalledTimes(1);

    const event2 = new KeyboardEvent("keydown", { key: "k", metaKey: true });
    Object.defineProperty(event2, "preventDefault", { value: vi.fn() });
    keydownHandler(event2);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe("COMMON_SHORTCUTS", () => {
  it("defines navigation shortcuts", () => {
    expect(COMMON_SHORTCUTS.goHome).toEqual({ key: "g h" });
    expect(COMMON_SHORTCUTS.goTasks).toEqual({ key: "g t" });
    expect(COMMON_SHORTCUTS.goCosts).toEqual({ key: "g c" });
  });

  it("defines action shortcuts", () => {
    expect(COMMON_SHORTCUTS.search).toEqual({ key: "k", meta: true });
    expect(COMMON_SHORTCUTS.newTask).toEqual({ key: "n" });
    expect(COMMON_SHORTCUTS.escape).toEqual({ key: "Escape" });
  });
});
