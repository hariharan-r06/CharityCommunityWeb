"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  User, 
  FilePlus, 
  MessageSquare, 
  LogOut, 
  Heart, 
  Pencil, 
  Save, 
  X, 
  Users,
  Link as LinkIcon,
  Building2,
  CreditCard,
  Building
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { auth } from "@/app/firebase"
import { getCharityByEmail, updateCharityProfile } from "@/services/apiService"
import { logout } from "@/services/authService"

interface BankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  accountType?: string;
  accountHolderName?: string;
}

export interface Charity {
  _id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  followers: any[];
  posts: any[];
  paymentLinks: any[];
  messages?: any[];
  bankDetails?: BankDetails;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentLink {
  gpayNo?: string;
  razorpay?: string;
}

export default function CharityProfilePage() {
  const router = useRouter()
  const [charity, setCharity] = useState<Charity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    gpayNo: "",
    razorpay: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    accountType: "",
    accountHolderName: ""
  })
  
  // Fetch bank details from ngo_data.json based on charity email
  const fetchBankDetailsFromNgoData = async (email: string) => {
    try {
      const response = await fetch('/api/bank-details?email=' + encodeURIComponent(email));
      if (!response.ok) {
        throw new Error('Failed to fetch bank details');
      }
      const data = await response.json();
      return data.bankDetails || null;
    } catch (error) {
      console.error('Error fetching bank details:', error);
      return null;
    }
  };
  
  useEffect(() => {
    const fetchCharityData = async () => {
      setLoading(true)
      const currentUser = auth.currentUser
      
      if (!currentUser || !currentUser.email) {
        console.log("No authenticated user found, redirecting to login")
        router.push("/auth/login")
        return
      }
      
      try {
        console.log("Fetching charity with email:", currentUser.email)
        const charityData = await getCharityByEmail(currentUser.email)
        
        // Fetch bank details from ngo_data.json
        const bankDetails = await fetchBankDetailsFromNgoData(currentUser.email)
        
        // Add bank details to charity data
        if (bankDetails) {
          charityData.bankDetails = bankDetails
        }
        
        setCharity(charityData)
        
        // Initialize edit form with current values
        const paymentLinks = charityData.paymentLinks && charityData.paymentLinks.length > 0 
          ? charityData.paymentLinks[0] 
          : {}
          
        setEditForm({
          name: charityData.name || "",
          phone: charityData.phone || "",
          address: charityData.address || "",
          gpayNo: paymentLinks.gpayNo || "",
          razorpay: paymentLinks.razorpay || "",
          bankName: charityData.bankDetails?.bankName || "",
          accountNumber: charityData.bankDetails?.accountNumber || "",
          ifscCode: charityData.bankDetails?.ifscCode || "",
          branch: charityData.bankDetails?.branch || "",
          accountType: charityData.bankDetails?.accountType || "",
          accountHolderName: charityData.bankDetails?.accountHolderName || ""
        })
      } catch (error) {
        console.error("Error fetching charity data:", error)
        setError("Failed to load your profile data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCharityData()
  }, [router])
  
  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }
  
  const handleEditToggle = () => {
    setIsEditMode(!isEditMode)
    
    // Reset form values when entering edit mode
    if (!isEditMode && charity) {
      const paymentLinks = charity.paymentLinks && charity.paymentLinks.length > 0 
        ? charity.paymentLinks[0] 
        : {}
        
      setEditForm({
        name: charity.name || "",
        phone: charity.phone || "",
        address: charity.address || "",
        gpayNo: paymentLinks.gpayNo || "",
        razorpay: paymentLinks.razorpay || "",
        bankName: charity.bankDetails?.bankName || "",
        accountNumber: charity.bankDetails?.accountNumber || "",
        ifscCode: charity.bankDetails?.ifscCode || "",
        branch: charity.bankDetails?.branch || "",
        accountType: charity.bankDetails?.accountType || "",
        accountHolderName: charity.bankDetails?.accountHolderName || ""
      })
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm({ ...editForm, [name]: value })
  }
  
  const handleProfileUpdate = async () => {
    try {
      if (!charity) return;
      
      const paymentLink: PaymentLink = {
        gpayNo: editForm.gpayNo,
        razorpay: editForm.razorpay
      }
      
      const bankDetails: BankDetails = {
        bankName: editForm.bankName,
        accountNumber: editForm.accountNumber,
        ifscCode: editForm.ifscCode,
        branch: editForm.branch,
        accountType: editForm.accountType,
        accountHolderName: editForm.accountHolderName
      }
      
      // Prepare the data for update
      const updateData = {
        name: editForm.name,
        email: charity.email, // Use existing email to avoid duplicates
        address: editForm.address,
        phone: editForm.phone,
        paymentLinks: [paymentLink],
        bankDetails: bankDetails
      };
      
      // Call the API to update the profile
      const updatedCharity = await updateCharityProfile(charity._id, updateData);
      
      // Update local state with the response
      setCharity(updatedCharity);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </div>
    )
  }
  
  const initials = charity?.name
    ? charity.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "C"
  
  // Extract payment links
  const paymentLinks = charity?.paymentLinks && charity.paymentLinks.length > 0 
    ? charity.paymentLinks[0] 
    : {}
  
  // Extract bank details
  const bankDetails = charity?.bankDetails || {}
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav user={charity ? {
            name: charity.name,
            email: charity.email,
            role: "charity"
          } : {
            name: "Loading...",
            email: "",
            role: "charity"
          }} />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex lg:w-[250px]">
          <nav className="grid items-start gap-2 px-2 py-4 text-sm">
            <Link
              href="/dashboard/charity"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <FilePlus className="h-4 w-4" />
              Posts
            </Link>
            <Link
              href={charity && charity._id ? `/messages/${charity._id}` : "/messages"}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href="/profile/charity"
              className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2 text-teal-800"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 mt-6"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>
        <main className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-teal-700 mb-2">
              Charity Profile
            </h1>
            <p className="text-gray-500">
              Manage your organization information and payment details
            </p>
          </div>
          
          <div className="grid gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" alt={charity?.name || "Charity"} />
                    <AvatarFallback className="bg-teal-100 text-teal-800">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{charity?.name}</CardTitle>
                    <CardDescription>{charity?.email}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant={isEditMode ? "destructive" : "outline"} 
                  size="sm" 
                  onClick={handleEditToggle}
                >
                  {isEditMode ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editForm.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="phone" className="text-sm font-medium">Contact Phone</label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={editForm.phone} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="address" className="text-sm font-medium">Address</label>
                      <Textarea 
                        id="address" 
                        name="address"
                        value={editForm.address} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Payment Information</h3>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label htmlFor="gpayNo" className="text-sm font-medium">Google Pay Number</label>
                          <Input 
                            id="gpayNo" 
                            name="gpayNo"
                            value={editForm.gpayNo} 
                            onChange={handleInputChange} 
                            placeholder="Enter GPay number" 
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="razorpay" className="text-sm font-medium">Razorpay Link</label>
                          <Input 
                            id="razorpay" 
                            name="razorpay"
                            value={editForm.razorpay} 
                            onChange={handleInputChange} 
                            placeholder="https://rzp.io/your-link" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Bank Account Details</h3>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <label htmlFor="bankName" className="text-sm font-medium">Bank Name</label>
                            <Input 
                              id="bankName" 
                              name="bankName"
                              value={editForm.bankName} 
                              onChange={handleInputChange} 
                              placeholder="e.g., HDFC Bank" 
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="branch" className="text-sm font-medium">Branch</label>
                            <Input 
                              id="branch" 
                              name="branch"
                              value={editForm.branch} 
                              onChange={handleInputChange} 
                              placeholder="e.g., Coimbatore Main" 
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <label htmlFor="accountHolderName" className="text-sm font-medium">Account Holder Name</label>
                          <Input 
                            id="accountHolderName" 
                            name="accountHolderName"
                            value={editForm.accountHolderName} 
                            onChange={handleInputChange} 
                            placeholder="Enter account holder name" 
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <label htmlFor="accountNumber" className="text-sm font-medium">Account Number</label>
                            <Input 
                              id="accountNumber" 
                              name="accountNumber"
                              value={editForm.accountNumber} 
                              onChange={handleInputChange} 
                              placeholder="Enter account number" 
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="accountType" className="text-sm font-medium">Account Type</label>
                            <Input 
                              id="accountType" 
                              name="accountType"
                              value={editForm.accountType} 
                              onChange={handleInputChange} 
                              placeholder="e.g., Savings, Current" 
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <label htmlFor="ifscCode" className="text-sm font-medium">IFSC Code</label>
                          <Input 
                            id="ifscCode" 
                            name="ifscCode"
                            value={editForm.ifscCode} 
                            onChange={handleInputChange} 
                            placeholder="e.g., HDFC0001234" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button className="mt-4" onClick={handleProfileUpdate}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                        <p className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-teal-600" />
                          Charity Organization
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                        <p>{charity?.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                        <p>{charity?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                        <p>{charity?.address || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Payment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Google Pay</h3>
                          <p>{paymentLinks.gpayNo || "Not provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Razorpay</h3>
                          {paymentLinks.razorpay ? (
                            <a 
                              href={paymentLinks.razorpay} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline flex items-center"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Payment link
                            </a>
                          ) : (
                            <p>Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">
                        <span className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
                          Bank Account Details
                        </span>
                      </h3>
                      
                      {bankDetails.bankName ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Bank Name</h3>
                            <p className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-teal-600" />
                              {bankDetails.bankName}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Branch</h3>
                            <p>{bankDetails.branch || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Account Holder</h3>
                            <p>{bankDetails.accountHolderName || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Account Type</h3>
                            <p>{bankDetails.accountType || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Account Number</h3>
                            <p>{bankDetails.accountNumber || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">IFSC Code</h3>
                            <p>{bankDetails.ifscCode || "Not provided"}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 border border-dashed rounded-lg">
                          <p className="text-muted-foreground mb-2">No bank details have been provided yet</p>
                          <p className="text-sm text-muted-foreground">Click 'Edit Profile' to add your bank account information</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Organization Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Followers</p>
                                <p className="text-2xl font-bold text-teal-600">{charity?.followers?.length || 0}</p>
                              </div>
                              <Users className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Posts</p>
                                <p className="text-2xl font-bold text-teal-600">{charity?.posts?.length || 0}</p>
                              </div>
                              <FilePlus className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Joined</p>
                                <p className="text-sm font-medium">
                                  {charity?.createdAt 
                                    ? new Date(charity.createdAt).toLocaleDateString() 
                                    : "Unknown"}
                                </p>
                              </div>
                              <User className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 