import BezierEasing from "bezier-easing";

export function findTimeForOffset(offset, p1, p2, p3, p4) {
    const easingFunction = BezierEasing(p1, p2, p3, p4);
    let t = 0;

    while (easingFunction(t) < offset) {
        t += 0.001; // Increment by a small step
    }

    return t;
}