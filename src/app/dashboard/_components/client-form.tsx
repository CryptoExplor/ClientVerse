'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { Client } from '@/types';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProductRecommendations } from '@/ai/flows/product-recommendations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Zod Schema Definition
const dynamicFieldSchema = z.object({ value: z.string().min(1, 'Cannot be empty') });
const addressSchema = z.object({
  type: z.enum(['Permanent', 'Current', 'Temporary']),
  value: z.string().min(1, 'Address cannot be empty'),
});
const policySchema = z.object({
  policyNo: z.string(),
  companyName: z.string(),
  healthInfo: z.string().optional(),
});
const investmentSchema = z.object({
    amc: z.string(),
    folio: z.string(),
    units: z.string(),
    nav: z.string(),
    investmentAmount: z.string(),
});
const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name cannot be empty'),
  value: z.string().min(1, 'Field value cannot be empty'),
});

const familyMemberSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    relationship: z.string(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    aadharMobile: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpiryDate: z.string().optional(),
    healthInfo: z.string().optional(),
    mobiles: z.array(dynamicFieldSchema).optional(),
    addresses: z.array(addressSchema).optional(),
    healthPolicies: z.array(policySchema).optional(),
    carBikePolicies: z.array(policySchema).optional(),
    lifePolicies: z.array(policySchema).optional(),
    mutualFundInvestments: z.array(investmentSchema).optional(),
    customFields: z.array(customFieldSchema).optional(),
});

const clientFormSchema = z.object({
  clientName: z.string().min(2, { message: 'Client name must be at least 2 characters.' }),
  referenceName: z.string().optional(),
  pan: z.string().optional(),
  incomeTaxPassword: z.string().optional(),
  aadhar: z.string().optional(),
  aadharMobile: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  remarks: z.string().optional(),
  mobiles: z.array(dynamicFieldSchema),
  addresses: z.array(addressSchema),
  healthPolicies: z.array(policySchema),
  carBikePolicies: z.array(policySchema),
  lifePolicies: z.array(policySchema),
  mutualFundInvestments: z.array(investmentSchema),
  customFields: z.array(customFieldSchema),
  familyMembers: z.array(familyMemberSchema),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client: Client | null;
  onFinished: () => void;
}

const SectionWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <>
      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4 border-b pb-2">{title}</h3>
      <div className="space-y-4">{children}</div>
    </>
);

const AddButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" /> {children}
    </Button>
);

const RemoveButton = ({ onClick }: { onClick: () => void }) => (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-4 w-4" />
    </Button>
);

export default function ClientForm({ client, onFinished }: ClientFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{ insurance: string[], investment: string[] } | null>(null);
  const [isRecoLoading, setIsRecoLoading] = useState(false);

  const defaultValues: Partial<ClientFormValues> = {
    clientName: client?.clientName ?? '',
    referenceName: client?.referenceName ?? '',
    pan: client?.pan ?? '',
    incomeTaxPassword: client?.incomeTaxPassword ?? '',
    aadhar: client?.aadhar ?? '',
    aadharMobile: client?.aadharMobile ?? '',
    passportNo: client?.passportNo ?? '',
    passportExpiryDate: client?.passportExpiryDate ?? '',
    remarks: client?.remarks ?? '',
    mobiles: client?.mobiles ?? [{ value: '' }],
    addresses: client?.addresses ?? [{ type: 'Permanent', value: '' }],
    healthPolicies: client?.healthPolicies ?? [],
    carBikePolicies: client?.carBikePolicies ?? [],
    lifePolicies: client?.lifePolicies ?? [],
    mutualFundInvestments: client?.mutualFundInvestments ?? [],
    customFields: client?.customFields ?? [],
    familyMembers: client?.familyMembers ?? [],
  };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields: mobileFields, append: appendMobile, remove: removeMobile } = useFieldArray({ control: form.control, name: 'mobiles' });
  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control: form.control, name: 'addresses' });
  const { fields: healthPolicyFields, append: appendHealthPolicy, remove: removeHealthPolicy } = useFieldArray({ control: form.control, name: 'healthPolicies' });
  const { fields: carBikePolicyFields, append: appendCarBikePolicy, remove: removeCarBikePolicy } = useFieldArray({ control: form.control, name: 'carBikePolicies' });
  const { fields: lifePolicyFields, append: appendLifePolicy, remove: removeLifePolicy } = useFieldArray({ control: form.control, name: 'lifePolicies' });
  const { fields: investmentFields, append: appendInvestment, remove: removeInvestment } = useFieldArray({ control: form.control, name: 'mutualFundInvestments' });
  const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({ control: form.control, name: 'customFields' });
  const { fields: familyMemberFields, append: appendFamilyMember, remove: removeFamilyMember } = useFieldArray({ control: form.control, name: 'familyMembers' });

  async function onSubmit(data: ClientFormValues) {
    if (!user) {
      toast({ variant: 'destructive', description: 'You must be logged in.' });
      return;
    }
    setLoading(true);
    
    const clientData = {
      ...data,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      ...(client ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      if (client) {
        const clientDocRef = doc(db, `clients/${user.uid}/userClients`, client.id!);
        await setDoc(clientDocRef, clientData, { merge: true });
        toast({ description: 'Client updated successfully.' });
      } else {
        await addDoc(collection(db, `clients/${user.uid}/userClients`), clientData);
        toast({ description: 'Client added successfully.' });
      }
      onFinished();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({ variant: 'destructive', description: 'Failed to save client.' });
    } finally {
      setLoading(false);
    }
  }

  const handleGetRecommendations = async () => {
    setIsRecoLoading(true);
    setRecommendations(null);
    try {
        const clientData = form.getValues();
        const result = await getProductRecommendations({ clientData: JSON.stringify(clientData) });
        setRecommendations({
            insurance: result.insuranceRecommendations,
            investment: result.investmentRecommendations,
        });
    } catch (error) {
        console.error("Error getting recommendations:", error);
        toast({ variant: 'destructive', description: 'Could not fetch AI recommendations.' });
    } finally {
        setIsRecoLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
        
        <SectionWrapper title="Basic Info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem><FormLabel>Client Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="referenceName" render={({ field }) => (
                    <FormItem><FormLabel>Reference Name</FormLabel><FormControl><Input placeholder="Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </SectionWrapper>

        <SectionWrapper title="Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="incomeTaxPassword" render={({ field }) => (<FormItem><FormLabel>Income Tax Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aadhar" render={({ field }) => (<FormItem><FormLabel>Aadhaar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aadharMobile" render={({ field }) => (<FormItem><FormLabel>Aadhaar-linked Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="passportNo" render={({ field }) => (<FormItem><FormLabel>Passport No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="passportExpiryDate" render={({ field }) => (<FormItem><FormLabel>Passport Expiry</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </SectionWrapper>

        <SectionWrapper title="Contact & Address">
            <FormItem>
                <FormLabel>Mobile Numbers</FormLabel>
                {mobileFields.map((field, index) => (
                    <FormField key={field.id} control={form.control} name={`mobiles.${index}.value`} render={({ field }) => (
                        <FormItem><FormControl><div className="flex items-center gap-2"><Input {...field} /><RemoveButton onClick={() => removeMobile(index)} /></div></FormControl><FormMessage /></FormItem>
                    )} />
                ))}
                <AddButton onClick={() => appendMobile({ value: '' })}>Add Mobile</AddButton>
            </FormItem>
            <FormItem>
                <FormLabel>Addresses</FormLabel>
                {addressFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                        <div className="flex-grow space-y-2">
                            <FormField control={form.control} name={`addresses.${index}.type`} render={({ field }) => (
                                <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Current">Current</SelectItem><SelectItem value="Temporary">Temporary</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`addresses.${index}.value`} render={({ field }) => (
                                <FormItem><FormControl><Textarea placeholder="Full Address" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <RemoveButton onClick={() => removeAddress(index)} />
                    </div>
                ))}
                <AddButton onClick={() => appendAddress({ type: 'Permanent', value: '' })}>Add Address</AddButton>
            </FormItem>
        </SectionWrapper>
        
        <SectionWrapper title="Policies">
            <Card><CardHeader><CardTitle className="text-base">Health Policies</CardTitle></CardHeader><CardContent>
            {healthPolicyFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md mb-2 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name={`healthPolicies.${index}.policyNo`} render={({ field }) => (<FormItem><FormLabel>Policy No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`healthPolicies.${index}.companyName`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`healthPolicies.${index}.healthInfo`} render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Health Info</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="absolute top-1 right-1"><RemoveButton onClick={() => removeHealthPolicy(index)} /></div>
                </div>
            ))}
            <AddButton onClick={() => appendHealthPolicy({ policyNo: '', companyName: '', healthInfo: '' })}>Add Health Policy</AddButton>
            </CardContent></Card>
            
            <Card><CardHeader><CardTitle className="text-base">Car/Bike Policies</CardTitle></CardHeader><CardContent>
            {carBikePolicyFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md mb-2 relative"><div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name={`carBikePolicies.${index}.policyNo`} render={({ field }) => (<FormItem><FormLabel>Policy No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`carBikePolicies.${index}.companyName`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div><div className="absolute top-1 right-1"><RemoveButton onClick={() => removeCarBikePolicy(index)} /></div></div>
            ))}
            <AddButton onClick={() => appendCarBikePolicy({ policyNo: '', companyName: '' })}>Add Car/Bike Policy</AddButton>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-base">Life Policies</CardTitle></CardHeader><CardContent>
            {lifePolicyFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md mb-2 relative"><div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name={`lifePolicies.${index}.policyNo`} render={({ field }) => (<FormItem><FormLabel>Policy No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`lifePolicies.${index}.companyName`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div><div className="absolute top-1 right-1"><RemoveButton onClick={() => removeLifePolicy(index)} /></div></div>
            ))}
            <AddButton onClick={() => appendLifePolicy({ policyNo: '', companyName: '' })}>Add Life Policy</AddButton>
            </CardContent></Card>
        </SectionWrapper>
        
        <SectionWrapper title="Mutual Fund Investments">
            {investmentFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md mb-2 relative"><div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name={`mutualFundInvestments.${index}.amc`} render={({ field }) => (<FormItem><FormLabel>AMC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`mutualFundInvestments.${index}.folio`} render={({ field }) => (<FormItem><FormLabel>Folio</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`mutualFundInvestments.${index}.units`} render={({ field }) => (<FormItem><FormLabel>Units</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`mutualFundInvestments.${index}.nav`} render={({ field }) => (<FormItem><FormLabel>NAV</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`mutualFundInvestments.${index}.investmentAmount`} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div><div className="absolute top-1 right-1"><RemoveButton onClick={() => removeInvestment(index)} /></div></div>
            ))}
            <AddButton onClick={() => appendInvestment({ amc: '', folio: '', units: '', nav: '', investmentAmount: '' })}>Add Investment</AddButton>
        </SectionWrapper>

        <SectionWrapper title="Custom Fields">
            {customFields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField control={form.control} name={`customFields.${index}.name`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Field Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`customFields.${index}.value`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Field Value</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <RemoveButton onClick={() => removeCustomField(index)} />
                </div>
            ))}
            <AddButton onClick={() => appendCustomField({ name: '', value: '' })}>Add Custom Field</AddButton>
        </SectionWrapper>
        
        <SectionWrapper title="Remarks">
            <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem><FormLabel>General Remarks</FormLabel><FormControl><Textarea placeholder="Any additional notes..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </SectionWrapper>
        
        <SectionWrapper title="Family Members">
            {familyMemberFields.map((member, index) => (
                <Card key={member.id} className="relative bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Family Member {index + 1}</CardTitle>
                        <div className="absolute top-2 right-2"><RemoveButton onClick={() => removeFamilyMember(index)} /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name={`familyMembers.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`familyMembers.${index}.relationship`} render={({ field }) => (<FormItem><FormLabel>Relationship</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <AddButton onClick={() => appendFamilyMember({ name: '', relationship: '' })}>Add Family Member</AddButton>
        </SectionWrapper>

        <Separator />
        
        {client && (
            <SectionWrapper title="AI Assistant">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Product Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isRecoLoading && <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin" /></div>}
                        {recommendations && (
                             <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-semibold mb-2">Insurance</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {recommendations.insurance.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Investments</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {recommendations.investment.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                        <Button type="button" variant="outline" onClick={handleGetRecommendations} disabled={isRecoLoading} className="mt-4">
                            <Wand2 className="mr-2 h-4 w-4"/> Get AI Recommendations
                        </Button>
                    </CardContent>
                </Card>
            </SectionWrapper>
        )}

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background/95 py-3 -mx-6 px-6 border-t">
          <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
          
          {client && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this client and all their associated data.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={async () => {
                              if (!user || !client?.id) return;
                              await deleteDoc(doc(db, `clients/${user.uid}/userClients`, client.id));
                              toast({ description: "Client deleted."});
                              onFinished();
                          }}
                      >
                          Yes, delete client
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
