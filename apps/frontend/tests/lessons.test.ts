import { describe, expect, it } from "vitest";
import { lessonKey } from "@/lib/content/locator";
import {
  getLessonState,
  getProfile,
  rateLesson,
  setBookmark,
} from "@/lib/lessons/api";
import { requestOf, stubFetch } from "./utils/fetch";

// The index locator, which is the key the API stores state under; the URL
// it travels on drops the corpus the route prefix already names.
const LESSON = lessonKey("information-theory", "entropy");

describe("the lesson state client", () => {
  it("reads the state of one lesson", async () => {
    const fetch = stubFetch({ rating: 1, bookmarked: true });

    const state = await getLessonState(LESSON);

    const [url, init] = requestOf(fetch);
    expect(url).toBe("/api/v1/lessons/information-theory/entropy");
    expect(init.credentials).toBe("same-origin");
    expect(state).toEqual({ rating: 1, bookmarked: true });
  });

  it("puts a rating as one of the two values", async () => {
    const fetch = stubFetch();

    await rateLesson(LESSON, -1);

    const [url, init] = requestOf(fetch);
    expect(url).toBe("/api/v1/lessons/information-theory/entropy/rating");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ value: -1 });
  });

  it("bookmarks with PUT and unbookmarks with DELETE", async () => {
    const added = stubFetch();
    await setBookmark(LESSON, true);
    expect(requestOf(added)[1].method).toBe("PUT");

    const removed = stubFetch();
    await setBookmark(LESSON, false);
    const [url, init] = requestOf(removed);
    expect(url).toBe("/api/v1/lessons/information-theory/entropy/bookmark");
    expect(init.method).toBe("DELETE");
  });

  it("reads history and bookmarks in one request", async () => {
    const fetch = stubFetch({ history: [], bookmarks: [] });

    await getProfile();

    expect(requestOf(fetch)[0]).toBe("/api/v1/profile");
  });
});
