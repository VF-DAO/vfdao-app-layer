import { Badge } from '@/components/ui/badge';

export function IngredientList({ ingredients, claims }: { ingredients: string[]; claims: string[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Ingredients</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ingredients.map((ingredient) => (
            <li
              key={ingredient}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
            >
              {ingredient}
            </li>
          ))}
        </ul>
      </div>
      {claims.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {claims.map((claim) => (
            <Badge key={claim} variant="primary">
              {claim}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
