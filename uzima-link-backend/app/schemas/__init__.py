from app.schemas.admin import (
    AdminDoctorKycOut,
    AdminPatientKycOut,
    InviteStaffRequest,
    StaffInviteOut,
)
from app.schemas.allergy import AllergyCreate, AllergyOut, AllergyRecommendation
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.schemas.auth import (
    DoctorRegister,
    ForgotPasswordRequest,
    FrontdeskRegister,
    LoginOtpSentOut,
    LoginRequest,
    PatientLoginChooseChannel,
    PatientLoginStart,
    PatientLoginVerify,
    PatientRegister,
    RegistrationPendingOut,
    ResendVerificationRequest,
    ResetPasswordRequest,
    StaffLoginVerify,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.clinical_entity import ClinicalEntityOut
from app.schemas.consent import (
    ConsentGrant,
    ConsentOut,
    ConsentRequestDecision,
    ConsentRequestOut,
)
from app.schemas.drug import DrugInfoOut
from app.schemas.facility import FacilityCreate, FacilityOut
from app.schemas.kyc import KycDecision, KycStatusOut
from app.schemas.patient import (
    DoctorPatientView,
    KycDecision,
    KycStatusOut,
    PatientCreate,
    PatientListItem,
    PatientNotification,
    PatientOut,
    PatientProfileOut,
    PatientProfileUpdate,
    PatientUpdate,
    VisitNoteItem,
)
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut
from app.schemas.queue import QueueAssign, QueueEntryCreate, QueueEntryOut
from app.schemas.user import StaffProfileOut, StaffProfileUpdate, UserOut
from app.schemas.visit import (
    DoctorNoteCreate,
    SymptomEntryCreate,
    VisitCreate,
    VisitNotesUpdate,
    VisitOut,
)
