export function eqn_100(consts, t, tc = null, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];

    try {
        if (integrated) {
            return a * t + 
                   b * Math.pow(t, 2) / 2 + 
                   c * Math.pow(t, 3) / 3 + 
                   d * Math.pow(t, 4) / 4 + 
                   e * Math.pow(t, 5) / 5;
        } else {
            return a + b * t + c * Math.pow(t, 2) + d * Math.pow(t, 3) + e * Math.pow(t, 4);
        }
    } catch (error) {
        return -1;
    }
}

export function eqn_101(consts, t) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];

    try {
        return Math.exp(a + b / t + c * Math.log(t) + d * Math.pow(t, e));
    } catch (error) {
        return -1;
    }
}

export function eqn_105(consts, t) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];

    try {
        return a / Math.pow(b, 1 + Math.pow(1 - t / c, d));
    } catch (error) {
        return -1;
    }
}

export function eqn_106(consts, t, tc, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];

    let tr = t / tc;

    if (tr >= 1) {
        return 0;
    }

    try {
        return a * Math.pow(1 - tr, b + c * tr + d * Math.pow(tr, 2) + e * Math.pow(tr, 3));
    } catch (error) {
        return 0;
    }
}

export function eqn_107(consts, t, tc = null, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];

    try {
        if (integrated) {
            return a * t + b * c / Math.tanh(c / t) - e * d * Math.tanh(e / t);
        } else {
            return a + b * Math.pow(c / t / Math.sinh(c / t), 2) + d * Math.pow(e / t / Math.cosh(e / t), 2);
        }
    } catch (error) {
        return -Infinity;
    }
}

export function eqn_114(consts, t, tc, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];

    let t_by_tc = t / tc;

    try {
        if (integrated) {
            return -(Math.pow(a, 2)) * tc * Math.log(Math.abs(t - tc)) + b * t - 2 * a * c * (t - Math.pow(t, 2) / 2 / tc) - a * d / 3 / Math.pow(tc, 2) * Math.pow(t - tc, 3) + Math.pow(c, 2) / 12 / Math.pow(tc, 3) * Math.pow(t - tc, 4) - c * d / 10 / Math.pow(tc, 4) * Math.pow(t - tc, 5) + Math.pow(d, 2) / 30 / Math.pow(tc, 5) * Math.pow(t - tc, 6);
        } else {
            let tau = 1 - t_by_tc;
            return Math.pow(a, 2) / tau + b - 2 * a * c * tau - a * d * Math.pow(tau, 2) - 1 / 3 * Math.pow(c, 2) * Math.pow(tau, 3) - 1 / 2 * c * d * Math.pow(tau, 4) - 1 / 5 * Math.pow(d, 2) * Math.pow(tau, 5);
        }
    } catch (error) {
        return -Infinity;
    }
}

export function eqn_124(consts, t, tc, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];

    let t_by_tc = t / tc;

    try {
        if (integrated) {
            return a * t - b * tc * Math.log(Math.abs(tc - t)) + c * t * (1 - 1 / 2 * t_by_tc) + d * t * (1 - t_by_tc + 1 / 3 * Math.pow(t_by_tc, 2)) + e * t * (1 - 3 / 2 * t_by_tc + Math.pow(t_by_tc, 2) - 1 / 4 * Math.pow(t_by_tc, 3));
        } else {
            let tau = 1 - t_by_tc;
            return a + b / tau + c * tau + d * Math.pow(tau, 2) + e * Math.pow(tau, 3);
        }
    } catch (error) {
        return -Infinity;
    }
}

export function eqn_127(consts, t, tc = null, integrated = false) {
    let a = consts[0];
    let b = consts[1];
    let c = consts[2];
    let d = consts[3];
    let e = consts[4];
    let f = consts[5];
    let g = consts[6];

    try {
        if (integrated) {
            return a * t + (b * c) / (Math.exp(c / t) - 1) + (e * d) / (Math.exp(e / t) - 1) + (f * g) / (Math.exp(g / t) - 1);
        } else {
            return a + b * Math.pow(c / t, 2) * Math.exp(c / t) / Math.pow(Math.exp(c / t) - 1, 2) + d * Math.pow(e / t, 2) * Math.exp(e / t) / Math.pow(Math.exp(e / t) - 1, 2) + f * Math.pow(g / t, 2) * Math.exp(g / t) / Math.pow(Math.exp(g / t) - 1, 2);
        }
    } catch (error) {
        return -Infinity;
    }
}