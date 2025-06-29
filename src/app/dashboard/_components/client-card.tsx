import type { Client } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, FileText, User, Phone, Home } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">{client.clientName}</CardTitle>
          {client.referenceName && (
             <CardDescription>Referred by: {client.referenceName}</CardDescription>
          )}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>PAN: {client.pan || 'N/A'}</span>
        </div>
        {client.mobiles?.[0]?.value && (
            <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>{client.mobiles[0].value}</span>
            </div>
        )}
        {client.addresses?.[0]?.value && (
             <div className="flex items-start">
                <Home className="h-4 w-4 mr-2 mt-1 shrink-0" />
                <span className="truncate">{client.addresses[0].value}</span>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onEdit}>
            <FileText className="mr-2 h-4 w-4" />
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
