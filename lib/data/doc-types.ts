/**
 * Document type registry.
 *
 * Each document type defines:
 *  - Which blocks the layout builder can add (addable)
 *  - Which blocks are always present and cannot be deleted (locked)
 *  - UI metadata: label, icon (lucide name), colour theme, description
 *  - Whether the AI layout assistant is available
 */

export type DocTypeId = 'quote' | 'review' | 'payment' | 'document_request';

/** Keys matching BLOCK_TEMPLATES inside layout-builder/page.tsx */
export type AddableBlockKey = 'image' | 'html' | 'text1col' | 'text2col' | 'text3col' | 'logo';

export interface DocTypeDefinition {
  id: DocTypeId;
  label: string;
  shortLabel: string;
  description: string;
  /** Lucide icon component name */
  icon: string;
  /** Tailwind colour name (used for badge/button tinting) */
  color: 'blue' | 'yellow' | 'green' | 'purple';
  /** Block keys from BLOCK_TEMPLATES that can be added to a layout of this type */
  addableBlocks: AddableBlockKey[];
  /**
   * Section `component` values that are always present in this doc type's layout
   * and must not be deleted or reordered out of position. The layout builder will
   * render these rows with a lock icon and no delete/duplicate controls.
   */
  lockedBlockComponents: string[];
  /** Whether the AI chat layout assistant is available for this doc type */
  supportsAI: boolean;
  /** Status: 'live' | 'coming_soon' — controls whether the Edit/Create button is enabled */
  status: 'live' | 'coming_soon';
}

export const DOC_TYPES: DocTypeDefinition[] = [
  {
    id: 'quote',
    label: 'Quote',
    shortLabel: 'Quote',
    description: 'Customer quotation document',
    icon: 'FileText',
    color: 'blue',
    addableBlocks: ['image', 'html', 'text1col', 'text2col', 'text3col'],
    lockedBlockComponents: [],
    supportsAI: true,
    status: 'live',
  },
  {
    id: 'review',
    label: 'Customer Review',
    shortLabel: 'Review',
    description: 'Post-move customer review form',
    icon: 'Star',
    color: 'yellow',
    // Header logo, intro copy (1-col text), image, and custom HTML paragraph blocks
    addableBlocks: ['logo', 'text1col', 'image', 'html'],
    // The review questions block is always present and cannot be removed
    lockedBlockComponents: ['ReviewQuestions'],
    supportsAI: false,
    status: 'live',
  },
  {
    id: 'payment',
    label: 'Online Payment',
    shortLabel: 'Payment',
    description: 'Online payment collection page',
    icon: 'CreditCard',
    color: 'green',
    addableBlocks: ['logo', 'text1col', 'image', 'html'],
    // The payment form block is always present and cannot be removed
    lockedBlockComponents: ['PaymentForm'],
    supportsAI: false,
    status: 'coming_soon',
  },
  {
    id: 'document_request',
    label: 'Document Request',
    shortLabel: 'Doc Request',
    description: 'Document request and collection form',
    icon: 'FolderOpen',
    color: 'purple',
    addableBlocks: ['logo', 'text1col', 'image', 'html'],
    // The document request fields block is always present and cannot be removed
    lockedBlockComponents: ['DocumentRequestFields'],
    supportsAI: false,
    status: 'coming_soon',
  },
];

export const DOC_TYPE_MAP = Object.fromEntries(
  DOC_TYPES.map((dt) => [dt.id, dt]),
) as Record<DocTypeId, DocTypeDefinition>;

/** Colour classes for each doc type (Tailwind safe-list friendly). */
export const DOC_TYPE_COLORS: Record<
  DocTypeDefinition['color'],
  { bg: string; text: string; border: string; badge: string; hover: string }
> = {
  blue: {
    bg:     'bg-blue-50',
    text:   'text-blue-700',
    border: 'border-blue-200',
    badge:  'bg-blue-100 text-blue-700',
    hover:  'hover:bg-blue-50',
  },
  yellow: {
    bg:     'bg-yellow-50',
    text:   'text-yellow-700',
    border: 'border-yellow-200',
    badge:  'bg-yellow-100 text-yellow-700',
    hover:  'hover:bg-yellow-50',
  },
  green: {
    bg:     'bg-green-50',
    text:   'text-green-700',
    border: 'border-green-200',
    badge:  'bg-green-100 text-green-700',
    hover:  'hover:bg-green-50',
  },
  purple: {
    bg:     'bg-purple-50',
    text:   'text-purple-700',
    border: 'border-purple-200',
    badge:  'bg-purple-100 text-purple-700',
    hover:  'hover:bg-purple-50',
  },
};
