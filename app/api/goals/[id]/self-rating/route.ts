import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { score, comment } = body;

    if (!score || score < 1 || score > 5) {
      return new NextResponse('Invalid rating score', { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.employeeId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (goal.status !== 'APPROVED') {
      return new NextResponse('Goal must be approved before rating', { status: 400 });
    }

    const rating = await prisma.rating.upsert({
      where: {
        goalId: params.id,
      },
      update: {
        score,
        comment,
        selfRatedById: session.user.id,
      },
      create: {
        score,
        comment,
        goalId: params.id,
        selfRatedById: session.user.id,
      },
    });

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error submitting self-rating:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 