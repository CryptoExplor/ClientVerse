'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ClientForm from './client-form';
import type { Client } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientFormSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  client: Client | null;
}

export default function ClientFormSheet({ isOpen, setIsOpen, client }: ClientFormSheetProps) {

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-4xl p-0">
        <ScrollArea className="h-full">
            <div className="p-6">
                <SheetHeader>
                    <SheetTitle className="text-2xl">
                    {client ? 'Edit Client Details' : 'Add New Client'}
                    </SheetTitle>
                    <SheetDescription>
                    {client
                        ? "Update the client's information below."
                        : 'Fill in the form to add a new client to your database.'}
                    </SheetDescription>
                </SheetHeader>
                <ClientForm client={client} onFinished={() => setIsOpen(false)} />
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
