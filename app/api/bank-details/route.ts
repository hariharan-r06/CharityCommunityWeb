import { NextRequest, NextResponse } from 'next/server';
import ngoData from '@/data/ngo_data.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Find the NGO with the matching email
    const ngo = ngoData.find(
      (org) => org.Email.toLowerCase() === email.toLowerCase()
    );

    if (!ngo) {
      return NextResponse.json(
        { message: 'No bank details found for this email' },
        { status: 404 }
      );
    }

    // Return the bank details if they exist
    if (ngo.Bankdetails) {
      return NextResponse.json({ bankDetails: ngo.Bankdetails });
    } else {
      return NextResponse.json(
        { message: 'No bank details found for this charity' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
} 