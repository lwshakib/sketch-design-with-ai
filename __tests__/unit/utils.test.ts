import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge tailwind classes", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });

  it("should handle conditional classes", () => {
    expect(cn("px-2", true && "py-2", false && "hidden")).toBe("px-2 py-2");
  });
});
