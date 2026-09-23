import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

// UPDATE — PUT /api/transactions/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transactionId = Number(id);

  if (Number.isNaN(transactionId)) {
    return NextResponse.json({ error: 'ID transaksi tidak valid' }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  const body = await request.json();
  const { type, amount, description, transactionDate } = body;

  if (type && type !== 'income' && type !== 'expense') {
    return NextResponse.json({ error: 'Jenis transaksi harus income atau expense' }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(type && { type }),
      ...(amount && { amount }),
      ...(description !== undefined && { description }),
      ...(transactionDate && { transactionDate: new Date(transactionDate) }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE — DELETE /api/transactions/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transactionId = Number(id);

  if (Number.isNaN(transactionId)) {
    return NextResponse.json({ error: 'ID transaksi tidak valid' }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  await prisma.transaction.delete({ where: { id: transactionId } });

  return NextResponse.json({ message: 'Transaksi dihapus' });
}