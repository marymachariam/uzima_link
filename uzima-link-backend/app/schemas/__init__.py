from app.schemas.auth import (
    PatientRegister, PatientLoginStart, PatientLoginChooseChannel, PatientLoginVerify,
    LoginOtpSentOut, DoctorRegister, FrontdeskRegister, LoginRequest,
    TokenResponse, ForgotPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest, RegistrationPendingOut, ResendVerificationRequest, StaffLoginVerify,
)

from app.schemas.patient import (
    PatientCreate, PatientOut, PatientListItem, VisitNoteItem,
    PatientUpdate, PatientNotification, PatientProfileOut,
    PatientProfileUpdate, KycStatusOut, KycDecision, DoctorPatientView,
)

from app.schemas.allergy import AllergyCreate, AllergyOut, AllergyRecommendation
from app.schemas.clinical_entity import ClinicalEntityOut
from app.schemas.facility import FacilityOut, FacilityCreate
from app.schemas.user import UserOut, StaffProfileUpdate, StaffProfileOut
from app.schemas.visit import VisitCreate, VisitOut, SymptomEntryCreate, VisitNotesUpdate, DoctorNoteCreate
from app.schemas.drug import DrugInfoOut
from app.schemas.consent import (
    ConsentGrant, ConsentOut, ConsentRequestOut, ConsentRequestDecision,
)
from app.schemas.kyc import KycStatusOut, KycDecision
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut
from app.schemas.queue import QueueEntryCreate, QueueAssign, QueueEntryOut
from app.schemas.admin import (
    InviteStaffRequest, StaffInviteOut, AdminPatientKycOut, AdminDoctorKycOut,
)
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse