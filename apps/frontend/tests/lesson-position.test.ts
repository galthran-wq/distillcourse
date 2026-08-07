import { beforeEach, describe, expect, it } from "vitest";
import { clearPosition, currentLocator, setPosition } from "@/lib/lesson/position";

// The store is module state on purpose; every lesson this file names is
// cleared so no test inherits another's position.
beforeEach(() => {
  clearPosition("intro", "surprise");
  clearPosition("info-theory", "entropy");
});

describe("the reader's position", () => {
  it("is nothing until a lesson reports one", () => {
    expect(currentLocator()).toBeNull();
  });

  it("names the section in the locator namespace the tools speak", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: "the-average" });

    expect(currentLocator()).toBe("lesson:info-theory/entropy#the-average");
  });

  it("names the lesson alone when it has no headings", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    expect(currentLocator()).toBe("lesson:info-theory/entropy");
  });

  it("keeps the lesson just entered when the previous one unmounts after it", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    clearPosition("intro", "surprise");

    expect(currentLocator()).toBe("lesson:info-theory/entropy");
  });

  it("forgets the lesson the reader left", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    clearPosition("info-theory", "entropy");

    expect(currentLocator()).toBeNull();
  });
});
