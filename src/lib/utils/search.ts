export function parseSearchQuery(query: string): { field: string | null; term: string } {
  if (query.includes('%')) {
    const [fieldHint, ...termParts] = query.split('%')
    const term = termParts.join('%').trim()
    const hint = fieldHint.trim().toLowerCase()

    const fieldMap: Record<string, string> = {
      piso: 'nome',
      marca: 'marca',
      cor: 'cor',
      codigo: 'codigo',
      modelo: 'modelo',
      dimensao: 'dimensao',
    }

    if (fieldMap[hint]) {
      return { field: fieldMap[hint], term }
    }
  }
  
  return { field: null, term: query.trim() }
}

export function buildSearchFilter(query: string): { column: string | null; term: string } {
  const { field, term } = parseSearchQuery(query)
  // Simple sanitize
  const sanitizedTerm = term.replace(/[%_]/g, '\\$&')
  return { column: field, term: sanitizedTerm }
}
