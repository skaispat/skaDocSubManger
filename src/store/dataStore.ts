import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocumentItem {
    id: string;
    sn: string; // Serial Number (mapped to id_no)
    companyName: string;
    documentType: string;
    category: string;
    documentName: string;
    needsRenewal: boolean;
    renewalDate?: string;
    file: string | null;
    fileContent?: string;
    date: string;
    status: string;
    validityPeriod?: string;
    brandName?: string;
    serialNo?: string;
    certificateNo?: string;
    location?: string;
    calibrationDate?: string;
    whatsappNo?: string;
}

export interface SubscriptionItem {
    id: string; // mapped to id_no
    sn: string;
    requestedDate: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
    startDate: string;
    endDate: string;
    status: string;
    service?: string;
    plan?: string;
    renewalDate?: string;
    renewalStatus?: string;
    renewalNumber?: string;
    approvalNo?: string;
    remarks?: string;
    approvalDate?: string;
    paymentDate?: string;
    paymentMethod?: string;
    paymentFile?: string;
    paymentFileContent?: string;
    file?: string | null;
    fileContent?: string;
    whatsappNo?: string;
}

export interface MasterItem {
    id: string;
    companyName: string;
    documentType: string;
    category: string;
}

export interface RenewalItem {
    id: string;
    documentId: string;
    sn: string;
    documentName: string;
    documentType: string;
    category: string;
    companyName: string;
    entryDate: string;
    oldRenewalDate: string;
    oldFile: string | null;
    renewalStatus: 'Yes' | 'No';
    nextRenewalDate: string | null;
    newFile: string | null;
    newFileContent?: string;
    oldFileContent?: string;
}

export interface SubscriptionRenewalItem {
    id: string;
    renewalNo: string;
    subscriptionId: string;
    sn: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    frequency: string;
    price: string;
    endDate: string;
    renewalStatus: string;
}

export interface ShareItem {
    id: string;
    shareNo: string;
    dateTime: string;
    docSerial: string;
    docName: string;
    docFile: string;
    sharedVia: 'Email' | 'WhatsApp';
    recipientName: string;
    contactInfo: string;
}

interface DataState {
    documents: DocumentItem[];
    subscriptions: SubscriptionItem[];
    masterData: MasterItem[];
    renewalHistory: RenewalItem[];
    subscriptionRenewalHistory: SubscriptionRenewalItem[];
    shareHistory: ShareItem[];
    
    // Setters
    setDocuments: (items: DocumentItem[]) => void;
    setSubscriptions: (items: SubscriptionItem[]) => void;
    setMasterData: (items: MasterItem[]) => void;
    setRenewalHistory: (items: RenewalItem[]) => void;
    setSubscriptionRenewalHistory: (items: SubscriptionRenewalItem[]) => void;
    setShareHistory: (items: ShareItem[]) => void;

    // Actions
    addDocument: (item: DocumentItem) => void;
    addDocuments: (items: DocumentItem[]) => void;
    addSubscription: (item: SubscriptionItem) => void;
    addMasterData: (item: MasterItem) => void;
    addRenewalHistory: (item: RenewalItem) => void;
    addSubscriptionRenewalHistory: (item: SubscriptionRenewalItem) => void;
    addShareHistory: (item: ShareItem) => void;
    
    updateDocument: (id: string, updatedItem: Partial<DocumentItem>) => void;
    updateSubscription: (id: string, updatedItem: Partial<SubscriptionItem>) => void;
    deleteDocument: (id: string) => void;
    deleteSubscription: (id: string) => void;
}

const useDataStore = create<DataState>()(
    persist(
        (set) => ({
            documents: [],
            subscriptions: [],
            masterData: [],
            renewalHistory: [],
            subscriptionRenewalHistory: [],
            shareHistory: [],

            setDocuments: (documents) => set({ documents }),
            setSubscriptions: (subscriptions) => set({ subscriptions }),
            setMasterData: (masterData) => set({ masterData }),
            setRenewalHistory: (renewalHistory) => set({ renewalHistory }),
            setSubscriptionRenewalHistory: (subscriptionRenewalHistory) => set({ subscriptionRenewalHistory }),
            setShareHistory: (shareHistory) => set({ shareHistory }),

            addDocument: (item) => set((state) => ({ documents: [...state.documents, item] })),
            addDocuments: (items) => set((state) => ({ documents: [...state.documents, ...items] })),
            addSubscription: (item) => set((state) => ({ subscriptions: [...state.subscriptions, item] })),
            addMasterData: (item) => set((state) => ({ masterData: [...state.masterData, item] })),
            addRenewalHistory: (item) => set((state) => ({ renewalHistory: [item, ...state.renewalHistory] })),
            addSubscriptionRenewalHistory: (item) => set((state) => ({ subscriptionRenewalHistory: [item, ...state.subscriptionRenewalHistory] })),
            addShareHistory: (item) => set((state) => ({ shareHistory: [item, ...state.shareHistory] })),
            
            updateDocument: (id, updatedItem) => set((state) => ({
                documents: state.documents.map((doc) =>
                    doc.id === id ? { ...doc, ...updatedItem } : doc
                )
            })),
            updateSubscription: (id, updatedItem) => set((state) => ({
                subscriptions: state.subscriptions.map((sub) =>
                    sub.id === id ? { ...sub, ...updatedItem } : sub
                )
            })),
            deleteDocument: (id) => set((state) => ({
                documents: state.documents.filter((doc) => doc.id !== id)
            })),
            deleteSubscription: (id) => set((state) => ({
                subscriptions: state.subscriptions.filter((sub) => sub.id !== id)
            })),
        }),
        {
            name: 'app-data-storage-v11',
        }
    )
);

export default useDataStore;
