"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, CreditCard, Smartphone, Share2, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DonateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  charity: string
  charityId?: string // Add charity ID
}

export function DonateDialog({ open, onOpenChange, charity, charityId = "CH-12345" }: DonateDialogProps) {
  const [donationType, setDonationType] = useState("one-time")
  const [amount, setAmount] = useState("25")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleDonate = () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)

      // Reset and close after showing success
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
      }, 2000)
    }, 1500)
  }

  const resetForm = () => {
    setDonationType("one-time")
    setAmount("25")
    setCustomAmount("")
    setPaymentMethod("card")
    setIsComplete(false)
  }

  const finalAmount = amount === "custom" ? customAmount : amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-teal-700 flex items-center">
            <Heart className="mr-2 h-5 w-5 fill-teal-100 text-teal-600" />
            Donate to {charity}
          </DialogTitle>
          <div className="flex items-center mt-1 mb-2">
            <Badge variant="outline" className="bg-teal-50 text-xs">
              ID: {charityId}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 ml-2 text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
          <DialogDescription>Your donation helps support their mission and create positive change.</DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-4 py-4">
            <Tabs defaultValue="one-time" value={donationType} onValueChange={setDonationType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one-time">One-time</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="amount">Select Amount</Label>
                  <RadioGroup
                    id="amount"
                    value={amount}
                    onValueChange={setAmount}
                    className="grid grid-cols-4 gap-2 mt-2"
                  >
                    <div>
                      <RadioGroupItem value="10" id="amount-10" className="peer sr-only" />
                      <Label
                        htmlFor="amount-10"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        $10
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="25" id="amount-25" className="peer sr-only" />
                      <Label
                        htmlFor="amount-25"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        $25
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="50" id="amount-50" className="peer sr-only" />
                      <Label
                        htmlFor="amount-50"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        $50
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="custom" id="amount-custom" className="peer sr-only" />
                      <Label
                        htmlFor="amount-custom"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        Custom
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {amount === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-amount">Custom Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="custom-amount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter amount"
                        className="pl-7"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-2">
                    <div>
                      <RadioGroupItem value="card" id="method-card" className="peer sr-only" />
                      <Label
                        htmlFor="method-card"
                        className="flex h-10 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-background text-xs font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        <CreditCard className="mb-1 h-4 w-4" />
                        Card
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="upi" id="method-upi" className="peer sr-only" />
                      <Label
                        htmlFor="method-upi"
                        className="flex h-10 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-background text-xs font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        <Smartphone className="mb-1 h-4 w-4" />
                        UPI
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="paytm" id="method-paytm" className="peer sr-only" />
                      <Label
                        htmlFor="method-paytm"
                        className="flex h-10 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-background text-xs font-medium ring-offset-background peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:text-teal-600 hover:bg-muted"
                      >
                        <svg
                          className="mb-1 h-4 w-4"
                          fill="none"
                          height="24"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          width="24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3.5" />
                          <path d="M20 14v7" />
                          <path d="M17 11v10" />
                          <path d="M14 15v6" />
                        </svg>
                        Paytm
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-700">Thank You!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your donation of ${finalAmount} to {charity} has been processed successfully.
            </p>

            <div className="mt-4 w-full p-3 bg-muted rounded-lg text-left">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-medium">TXN-{Math.floor(Math.random() * 100000)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">
                  {paymentMethod === "card" ? "Credit Card" : paymentMethod === "upi" ? "UPI" : "Paytm"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex items-center">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                Download Receipt
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        )}

        {!isComplete && (
          <DialogFooter>
            <Button
              onClick={handleDonate}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isProcessing || (amount === "custom" && !customAmount)}
            >
              {isProcessing ? "Processing..." : `Donate $${finalAmount}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
