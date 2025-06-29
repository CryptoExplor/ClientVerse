'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { type Client } from '@/types';
import ClientCard from './_components/client-card';
import ClientFormSheet from './_components/client-form-sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const clientsRef = collection(db, `clients/${user.uid}/userClients`);
    const q = query(clientsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Client));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load clients.',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleAddNewClient = () => {
    setEditingClient(null);
    setIsSheetOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsSheetOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user || !clientId) return;
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
        return;
    }
    try {
        await deleteDoc(doc(db, `clients/${user.uid}/userClients`, clientId));
        toast({
            title: 'Success',
            description: 'Client deleted successfully.',
        });
    } catch (error) {
        console.error("Error deleting client:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete client.',
        });
    }
  };

  const filteredClients = clients.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
            <p className="text-muted-foreground">Manage your client database here.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <Input
            type="text"
            placeholder="Search clients..."
            className="w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleAddNewClient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <ClientCard 
                key={client.id} 
                client={client} 
                onEdit={() => handleEditClient(client)}
                onDelete={() => handleDeleteClient(client.id!)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-medium">No Clients Found</h3>
          <p className="text-muted-foreground mt-2">
            Get started by adding a new client.
          </p>
          <Button onClick={handleAddNewClient} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Client
          </Button>
        </div>
      )}

      <ClientFormSheet 
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        client={editingClient}
      />
    </div>
  );
}
