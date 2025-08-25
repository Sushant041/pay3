import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Esop from "@/models/Esop";

export const dynamic = "force-dynamic";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const data = await req.json();

        const updatedEsop = await Esop.findByIdAndUpdate(
            params.id,
            { $set: {claimed: data.claimed} }, // ensures only given fields update
            { new: true, runValidators: true }
        )
            .populate("employeeId", "name designation walletAddress vestingContractAddress")
            .exec();

        if (!updatedEsop) {
            return NextResponse.json(
                { success: false, error: "ESOP not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, esop: updatedEsop });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
