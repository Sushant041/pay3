import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import Esop from "@/models/Esop";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const { id } = params;

  // Validate ObjectId format (MongoDB)
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const deleted = await Esop.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Vesting not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting vesting:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
