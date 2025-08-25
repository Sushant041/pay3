import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { vestingContractAddress } = await req.json();
    const employeeId = params.id;

    if (!vestingContractAddress) {
      return NextResponse.json(
        { success: false, error: "Vesting contract address is required" },
        { status: 400 }
      );
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { vestingContractAddress } },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
