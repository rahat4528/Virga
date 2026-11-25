import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export interface ClientRowData {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
}

interface ClientsGridProps {
  clients: ClientRowData[]
}

export function ClientsGrid({ clients = [] }: ClientsGridProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Client Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Member Since</TableHead>
            <TableHead className="text-right">Profile</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No clients found.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-semibold text-foreground">
                  <Link href={`/studio/clients/${c._id}`} className="hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-foreground/90">
                  {c.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-full text-xs capitalize">
                    {c.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.phone || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                    <Link href={`/studio/clients/${c._id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default ClientsGrid
