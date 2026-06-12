export const emptyContest = {
  title: "",
  organizer: "",
  prize: "",
  registrationPeriod: "",
  category: "",
  description: "",
  isActive: true,
  link: "",
  registrationDeadline: "",
  awardCount: 0,
  maxTeamSize: 5,
  duplicateAllowed: false,
  hasPresentation: false,
  presentationDate: "",
  hackathonDate: "",
  linkedCommercialization: false,
  hasCertificate: false,
  notes: ""
};

export const emptyMember = {
  name: "",
  school: "",
  major: "",
  generation: "",
  role: "member",
  isLeader: false
};

export const emptyAnnouncement = {
  title: "",
  body: ""
};

export const emptyAward = {
  contestTitle: "",
  awardResult: "",
  body: ""
};

export const emptyAdminNotification = {
  memberId: "",
  title: "",
  body: "",
  href: "",
  type: "notice"
};

export const emptyTeamEdit = {
  introduction: "",
  requiredMembers: 4,
  status: "recruiting"
};

export const emptySurvey = {
  surveyPurpose: "",
  surveyIntensity: "",
  surveyRole: "",
  surveyExperience: "",
  surveyStrengths: "",
  surveyTeamStyle: ""
};
