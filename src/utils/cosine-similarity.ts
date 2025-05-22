export function cosineSimilarityNorm(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must be same length')
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}

export function normalizeEmbedding(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x ** 2, 0))
  return vec.map((x) => x / norm)
}
