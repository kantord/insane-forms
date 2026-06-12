import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** Demo submit handler: toasts the parsed z.output. Examples pass it as one
 * honest line — `onSubmit={demoSubmit}` — instead of inlining toast plumbing.
 * Signature-compatible with any real handler a consumer would write. */
export const demoSubmit = (data: unknown) => {
  toast(<pre>{JSON.stringify(data, null, 2)}</pre>)
}

/** Demo catalog for table-filtering examples. */
export type Product = {
  name: string
  category: 'Audio' | 'Video' | 'Accessories'
  price: number
  inStock: boolean
}

export const products: Product[] = [
  { name: 'Studio Headphones', category: 'Audio', price: 249, inStock: true },
  { name: 'USB Microphone', category: 'Audio', price: 129, inStock: true },
  { name: 'Portable Speaker', category: 'Audio', price: 89, inStock: false },
  { name: '4K Webcam', category: 'Video', price: 199, inStock: true },
  { name: 'Capture Card', category: 'Video', price: 159, inStock: false },
  { name: 'Ring Light', category: 'Video', price: 49, inStock: true },
  { name: 'Boom Arm', category: 'Accessories', price: 39, inStock: true },
  { name: 'Cable Kit', category: 'Accessories', price: 19, inStock: false },
]

/** Read-only product table — display chrome, not the point of the examples. */
export const ProductTable = ({ rows }: { rows: Product[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Category</TableHead>
        <TableHead className="text-right">Price</TableHead>
        <TableHead>Availability</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((p) => (
        <TableRow key={p.name}>
          <TableCell>{p.name}</TableCell>
          <TableCell>{p.category}</TableCell>
          <TableCell className="text-right">${p.price}</TableCell>
          <TableCell>{p.inStock ? 'In stock' : 'Backordered'}</TableCell>
        </TableRow>
      ))}
      {rows.length === 0 && (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-muted-foreground">
            No products match.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
)
