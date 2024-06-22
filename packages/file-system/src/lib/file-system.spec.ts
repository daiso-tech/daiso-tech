import { describe, expect, test } from "vitest";

import { fileSystem } from "./file-system";

describe("fileSystem", () => {
    test("should work", () => {
        expect(fileSystem()).toEqual("file-system");
    });
});
