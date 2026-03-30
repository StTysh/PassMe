import { profileSchema } from "@/lib/validation/profile";
import { handleRouteError, ok } from "@/lib/api";
import { profilesService } from "@/lib/services/profiles";

export async function GET() {
  try {
    return ok({ profiles: profilesService.listProfiles() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = profileSchema.parse(await request.json());
    const profile = profilesService.createCandidateProfile({
      fullName: body.fullName,
      headline: body.headline || null,
      email: body.email || null,
      yearsExperience: body.yearsExperience ?? null,
      targetRoles: body.targetRoles,
      primaryDomain: body.primaryDomain || null,
      notes: body.notes || null,
    });

    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
