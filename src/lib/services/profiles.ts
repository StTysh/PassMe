import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { profilesRepo } from "@/lib/repositories/profilesRepo";

export const profilesService = {
  createCandidateProfile(input: {
    fullName: string;
    headline: string | null;
    email: string | null;
    yearsExperience: number | null;
    targetRoles: string[];
    primaryDomain: string | null;
    notes: string | null;
  }) {
    ensureDatabaseReady();
    return profilesRepo.createProfile(input);
  },

  updateCandidateProfile(
    id: string,
    input: {
      fullName: string;
      headline: string | null;
      email: string | null;
      yearsExperience: number | null;
      targetRoles: string[];
      primaryDomain: string | null;
      notes: string | null;
    },
  ) {
    ensureDatabaseReady();
    return profilesRepo.updateProfile(id, input);
  },

  getCandidateWorkspace(profileId: string) {
    ensureDatabaseReady();
    const profile = profilesRepo.getProfileById(profileId);
    if (!profile) {
      return null;
    }

    const documents = documentsRepo.listDocumentsForProfile(profileId);
    const sessions = interviewsRepo.listSessionsForProfile(profileId);

    return {
      profile,
      documents,
      sessions,
    };
  },

  listProfiles() {
    ensureDatabaseReady();
    return profilesRepo.listProfiles();
  },

  getProfileById(profileId: string) {
    ensureDatabaseReady();
    return profilesRepo.getProfileById(profileId);
  },
};
