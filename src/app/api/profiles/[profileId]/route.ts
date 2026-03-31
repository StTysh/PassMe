import { NotFoundError, handleRouteError, ok } from "@/lib/api";
import { profilesService } from "@/lib/services/profiles";
import { profileSchema } from "@/lib/validation/profile";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const workspace = profilesService.getCandidateWorkspace(profileId);
    if (!workspace) {
      throw new NotFoundError("Profile not found.");
    }
    return ok(workspace);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const body = profileSchema.parse(await request.json());
    const profile = profilesService.updateCandidateProfile(profileId, {
      fullName: body.fullName,
      headline: body.headline || null,
      email: body.email || null,
      yearsExperience: body.yearsExperience ?? null,
      targetRoles: body.targetRoles,
      primaryDomain: body.primaryDomain || null,
      notes: body.notes || null,
    });
    if (!profile) {
      throw new NotFoundError("Profile not found.");
    }
    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
