"use client"

// app/auth/charity-verification/page.tsx
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Heart, CheckCircle2, Upload } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { signInWithGoogle, registerWithEmailAndPassword, verifyOrganization } from "@/services/authService"
import { storeCharityData } from "@/services/charityVerificationService"
import ngoData from "@/data/ngo_data.json"
import { createCharityProfile, createUserProfile } from "@/services/apiService"

interface FormData {
  organizationName: string;
  email: string;
  address: string;
  phone: string;
  description: string;
  password: string;
  confirmPassword: string;
  taxId: string;
  taxStatus: string;
  mission: string;
  category: string;
  scope: string;
  documents: File[];
  termsAccepted: boolean;
}

export default function CharityVerificationPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState("step1")
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    email: "",
    address: "",
    phone: "",
    description: "",
    password: "",
    confirmPassword: "",
    taxId: "",
    taxStatus: "",
    mission: "",
    category: "",
    scope: "",
    documents: [],
    termsAccepted: false
  })
  const [isVerified, setIsVerified] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    setVerificationError("")

    try {
      const userCredential = await signInWithGoogle()
      const user = userCredential.user
      
      // Check if organization exists in our database
      const organization = ngoData.find(
        (ngo) => 
          ngo["Charity Name"].toLowerCase() === formData.organizationName.toLowerCase() &&
          ngo.Email.toLowerCase() === user.email?.toLowerCase()
      )

      if (organization) {
        setIsVerified(true)
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
          organizationName: organization["Charity Name"],
          address: organization.Address || ""
        }))
        
        // Pre-create the charity profile on verification success
        try {
          const charityResponse = await createCharityProfile({
            name: organization["Charity Name"],
            email: user.email || "",
            address: organization.Address || ""
          })
          
          // Store charity ID for later use during final submission
          if (typeof window !== 'undefined') {
            localStorage.setItem('verifiedCharityId', charityResponse.data._id);
          }
        } catch (profileError) {
          console.error("Error pre-creating charity profile:", profileError);
          // Continue with verification process even if profile creation fails
        }
      } else {
        setVerificationError("Organization not found or email doesn't match our records.")
      }
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.")
      console.error("Google sign-in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      if (activeStep === "step1") {
        setActiveStep("step2")
      } else if (activeStep === "step2") {
        setActiveStep("step3")
      } else if (activeStep === "step3") {
        setActiveStep("step4")
      }
    }
  }

  const handlePrevStep = () => {
    if (activeStep === "step2") {
      setActiveStep("step1")
    } else if (activeStep === "step3") {
      setActiveStep("step2")
    } else if (activeStep === "step4") {
      setActiveStep("step3")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep("step4")) {
      setIsLoading(true)
      setError("")

      try {
        const userCredential = await registerWithEmailAndPassword(
          formData.email,
          formData.password,
          formData.organizationName
        )

        // Create charity profile in backend
        const charityResponse = await createCharityProfile({
          name: formData.organizationName,
          email: formData.email,
          address: formData.address,
          phone: formData.phone,
          paymentLinks: []
        })
        
        // Extract the charity ID from the response
        const charityId = charityResponse.data._id;

        // Create a user record
        try {
          await createUserProfile({
            name: formData.organizationName,
            email: formData.email,
            phone: formData.phone || '',
            role: 'charity',
            address: formData.address
          });
        } catch (profileError) {
          console.error("Error creating user profile:", profileError);
          // Continue even if there's an error with user profile creation
        }

        // Store additional charity data in Firestore
        await storeCharityData(userCredential.user.uid, {
          name: formData.organizationName,
          email: formData.email,
          address: formData.address,
          phone: formData.phone,
          taxId: formData.taxId,
          taxStatus: formData.taxStatus,
          mission: formData.mission,
          category: formData.category,
          scope: formData.scope,
          documents: formData.documents,
          verificationMethod: "google"
        })

        setIsLoading(false)
        // Redirect to charity dashboard with ID
        router.push(`/dashboard/charity/${charityId}?verification=pending`)
      } catch (error) {
        setError("Failed to register. Please try again.")
        setIsLoading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, documents: Array.from(e.target.files || []) }))
    }
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setFormData(prev => ({ ...prev, password: newPassword }))
    calculatePasswordStrength(newPassword)
  }

  const getStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 25) return "Weak"
    if (passwordStrength < 50) return "Fair"
    if (passwordStrength < 75) return "Good"
    return "Strong"
  }

  const validateStep = (step: string): boolean => {
    const errors: Record<string, string> = {}

    if (step === "step1") {
      if (!formData.organizationName.trim()) errors.organizationName = "Organization name is required"
    } else if (step === "step2") {
      if (!formData.taxId.trim()) errors.taxId = "Tax ID/EIN number is required"
      if (!formData.taxStatus) errors.taxStatus = "Tax-exempt status is required"
      if (formData.documents.length === 0) errors.documents = "Verification documents are required"
    } else if (step === "step3") {
      if (!formData.mission.trim()) errors.mission = "Mission statement is required"
      if (!formData.category) errors.category = "Cause category is required"
      if (!formData.scope) errors.scope = "Geographic scope is required"
    } else if (step === "step4") {
      if (!formData.password) errors.password = "Password is required"
      else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters"
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match"
      if (!formData.termsAccepted) errors.terms = "You must accept the terms of service"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8">
      <div className="flex items-center gap-2 font-bold text-xl text-teal-600 mb-8">
        <Heart className="h-6 w-6 fill-teal-600" />
        <span>CharityConnect</span>
      </div>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-700">Charity Verification</CardTitle>
          <CardDescription>
            Complete the verification process to establish your organization's credibility on our platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStep} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1" disabled>
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="step2" disabled>
                Legal Information
              </TabsTrigger>
              <TabsTrigger value="step3" disabled>
                Organization Details
              </TabsTrigger>
              <TabsTrigger value="step4" disabled>
                Account Creation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="org-name"
                    type="text"
                    placeholder="Your Charity Organization"
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    required
                    className={`flex-1 ${formErrors.organizationName ? "border-red-500" : ""}`}
                  />
                </div>
                {formErrors.organizationName && <p className="text-xs text-red-500">{formErrors.organizationName}</p>}
              </div>

              {verificationError && (
                <Alert variant="destructive">
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}

              {!isVerified && (
                <div className="space-y-2 pt-4">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Verify with:</p>
                    <Button
                      onClick={handleGoogleSignIn}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isLoading || !formData.organizationName.trim()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                      </svg>
                      Verify with Google
                    </Button>
                  </div>
                </div>
              )}

              {isVerified && (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Verification successful! Please proceed to the next step.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </TabsContent>

            <TabsContent value="step2" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-id">
                  Tax ID/EIN Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tax-id"
                  type="text"
                  placeholder="XX-XXXXXXX"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  required
                  className={formErrors.taxId ? "border-red-500" : ""}
                />
                {formErrors.taxId && <p className="text-xs text-red-500">{formErrors.taxId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-status">
                  Tax-exempt Status <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.taxStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, taxStatus: value }))}>
                  <SelectTrigger id="tax-status" className={formErrors.taxStatus ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select tax-exempt status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="501c3">501(c)(3) - Public Charity</SelectItem>
                    <SelectItem value="501c4">501(c)(4) - Social Welfare</SelectItem>
                    <SelectItem value="501c7">501(c)(7) - Social Club</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.taxStatus && <p className="text-xs text-red-500">{formErrors.taxStatus}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="documents">
                  Verification Documents <span className="text-red-500">*</span>
                </Label>
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="documents"
                    className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border ${
                      formErrors.documents ? "border-red-500" : "border-dashed border-input"
                    } bg-background p-4 text-sm text-muted-foreground hover:bg-muted/50`}
                  >
                    <Upload className="mb-2 h-6 w-6" />
                    <span className="font-medium">Click to upload</span>
                    <span className="text-xs">Upload tax exemption letter, registration certificate, etc.</span>
                    {formData.documents.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-teal-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{formData.documents.length} file(s) selected</span>
                      </div>
                    )}
                  </Label>
                  <Input id="documents" type="file" multiple className="hidden" onChange={handleFileChange} />
                  {formErrors.documents && <p className="text-xs text-red-500">{formErrors.documents}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="step3" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission">
                  Mission Statement <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="mission"
                  placeholder="Describe your organization's mission and goals..."
                  value={formData.mission}
                  onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                  required
                  className={`min-h-[120px] ${formErrors.mission ? "border-red-500" : ""}`}
                />
                {formErrors.mission && <p className="text-xs text-red-500">{formErrors.mission}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  Cause Category <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger id="category" className={formErrors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select primary cause category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health & Medical</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="animals">Animal Welfare</SelectItem>
                    <SelectItem value="humanitarian">Humanitarian Aid</SelectItem>
                    <SelectItem value="arts">Arts & Culture</SelectItem>
                    <SelectItem value="community">Community Development</SelectItem>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-xs text-red-500">{formErrors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">
                  Geographic Scope <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.scope} onValueChange={(value) => setFormData(prev => ({ ...prev, scope: value }))}>
                  <SelectTrigger id="scope" className={formErrors.scope ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select geographic scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.scope && <p className="text-xs text-red-500">{formErrors.scope}</p>}
              </div>
            </TabsContent>

            <TabsContent value="step4" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input id="account-email" type="email" value={formData.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">This email will be used for your account login</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                  className={formErrors.password ? "border-red-500" : ""}
                />
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Progress value={passwordStrength} className={`h-2 ${getStrengthColor()}`} />
                      <span className="text-xs ml-2">{getStrengthText()}</span>
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={formData.password.length >= 8 ? "text-green-600" : ""}>• At least 8 characters</li>
                      <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>• At least one uppercase letter</li>
                      <li className={/[0-9]/.test(formData.password) ? "text-green-600" : ""}>• At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : ""}>• At least one special character</li>
                    </ul>
                  </div>
                )}
                {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-confirm-password">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className={formErrors.confirmPassword ? "border-red-500" : ""}
                />
                {formErrors.confirmPassword && <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))}
                  className={formErrors.terms ? "border-red-500" : ""}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-teal-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-teal-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {formErrors.terms && <p className="text-xs text-red-500">{formErrors.terms}</p>}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          {activeStep !== "step1" ? (
            <Button variant="outline" onClick={handlePrevStep}>
              Previous
            </Button>
          ) : (
            <div></div>
          )}

          {activeStep !== "step4" ? (
            <Button onClick={handleNextStep} className="bg-teal-600 hover:bg-teal-700">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
