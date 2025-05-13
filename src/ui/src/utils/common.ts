export function enumToOptions<T extends Record<string, string | number>>(e: T) {
    return Object.keys(e)
        .filter(k => isNaN(Number(k))) // 避免反向映射
        .map(k => ({
            label: k as keyof T,
            value: e[k as keyof T],
        }));
}