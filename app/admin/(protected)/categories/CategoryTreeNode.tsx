import CategoryRow from "./CategoryRow";

export interface CategoryTreeNodeData {
  id: string;
  slug: string;
  name: string;
  icon: string;
  parent: string | null;
  rfqCount: number;
  children: CategoryTreeNodeData[];
}

interface ParentOption {
  id: string;
  name: string;
}

function collectIds(node: CategoryTreeNodeData): string[] {
  return [node.id, ...node.children.flatMap(collectIds)];
}

/**
 * Renders one category row, then recurses into its children —
 * however many levels deep the admin has actually created (see
 * lib/queries.ts's getFullCategoryTree(), unlike the old hardcoded
 * 2-level render this replaced).
 *
 * `allParentOptions` is the full flat list of every category (for the
 * "move to a different parent" dropdown); each node excludes ITSELF
 * and its own descendants from that list before handing it to
 * CategoryRow, since choosing either would create a cycle — the
 * server action re-checks this too (the authoritative guard), this is
 * just so the dropdown doesn't even offer the invalid choice.
 */
export default function CategoryTreeNode({
  node,
  depth,
  allParentOptions
}: {
  node: CategoryTreeNodeData;
  depth: number;
  allParentOptions: ParentOption[];
}) {
  const ownSubtreeIds = new Set(collectIds(node));
  const validParents = allParentOptions.filter((p) => !ownSubtreeIds.has(p.id));

  return (
    <div className="space-y-2">
      <CategoryRow
        category={{
          id: node.id,
          slug: node.slug,
          name: node.name,
          icon: node.icon,
          rfqCount: node.rfqCount,
          parent: node.parent
        }}
        parents={validParents}
        depth={depth}
      />
      {node.children.length > 0 && (
        <div className="mr-6 space-y-2 border-r-2 border-camel-100 pr-4">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              allParentOptions={allParentOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
