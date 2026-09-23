import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

// READ — GET /api/transactions
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { transactionDate: 'desc' },
  });

  return NextResponse.json(transactions);
}

// CREATE — POST /api/transactions
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const body = await request.json();
  const { type, amount, description, transactionDate } = body;

  // Validasi input
  if (type !== 'income' && type !== 'expense') {
    return NextResponse.json({ error: 'Jenis transaksi harus income atau expense' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Nominal harus berupa angka positif' }, { status: 400 });
  }
  if (!transactionDate) {
    return NextResponse.json({ error: 'Tanggal transaksi wajib diisi' }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId, // <- diambil dari session, BUKAN dari body request
      type,
      amount,
      description,
      transactionDate: new Date(transactionDate),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}