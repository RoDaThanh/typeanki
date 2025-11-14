import { removeSpace } from "./utils/normalizeText";

describe("normalizeText", () => {   

    test('Many spaces', () => {
        let text = "helo    world"            
    expect(removeSpace(text)).toBe("helo world");
    });

    test('one world', () => {
        let text = "helo"            
    expect(removeSpace(text)).toBe("helo");
    });

    test('space before and after', () => {
        let text = " hello  thanh dep trai "            
    expect(removeSpace(text)).toBe("hello thanh dep trai");
    });
})