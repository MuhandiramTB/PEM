import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { Role, Prisma, Status } from '@prisma/client';

// Define types for the goal data
type GoalData = {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: Date;
  userId: string;
  managerId: string;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName?: string;
  userEmail?: string;
  managerName?: string;
  managerEmail?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    if (session.user.role === Role.MANAGER) {
      // Managers see goals they need to approve
      const goals = await prisma.goal.findMany({
        where: {
          managerId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json(goals);
    } else {
      // Employees see their own goals
      const goals = await prisma.goal.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json(goals);
    }
  } catch (error) {
    console.error('Error fetching goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check if user ID exists in session
  if (!session.user || !session.user.id) {
    console.error('User ID not found in session:', session);
    
    // Try to find the user by email as a fallback
    if (session.user && session.user.email) {
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
      });
      
      if (user) {
        console.log('Found user by email:', user.id);
        // Use the found user ID
        session.user.id = user.id;
      } else {
        return new NextResponse('User not found', { status: 400 });
      }
    } else {
      return new NextResponse('User ID not found in session', { status: 400 });
    }
  }

  try {
    const body = await request.json();
    console.log('Received goal creation request:', body);
    
    const { title, description, dueDate } = body;
    
    if (!title || !description || !dueDate) {
      console.error('Missing required fields:', { title, description, dueDate });
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate date format
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date format:', dueDate);
      return new NextResponse('Invalid date format', { status: 400 });
    }

    // Find a manager to assign the goal to
    const manager = await prisma.user.findFirst({
      where: {
        role: Role.MANAGER,
      },
    });

    if (!manager) {
      console.error('No manager found in the system');
      return new NextResponse('No manager found in the system', { status: 400 });
    }

    console.log('Found manager:', manager.id);
    console.log('Creating goal for user:', session.user.id);

    // Create the goal with direct ID references
    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: parsedDate,
        status: "PENDING",
        userId: session.user.id,
        managerId: manager.id
      }
    });

    console.log('Goal created successfully:', goal);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error in goal creation route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.MANAGER) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { goalId, status, comments } = body;

    const updateData: Prisma.GoalUncheckedUpdateInput = {
      status,
      comments,
    };

    const goal = await prisma.goal.update({
      where: {
        id: goalId,
        managerId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 