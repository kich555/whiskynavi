import { UserBusinessApplicationResponse } from "@/apis/generated/api";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { FC } from "react";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const formatBusinessType = (application: UserBusinessApplicationResponse & { businessType?: string }): string => {
  const businessType = application.businessType;
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

interface Props {
  applicationHistory: UserBusinessApplicationResponse[] | null;
}

const BusinessApplyHistory: FC<Props> = ({ applicationHistory }) => {
  return (
    <div className="overflow-y-auto px-4 pb-4">
      <div className="space-y-3">
        {applicationHistory?.map((application) => (
          <div key={application.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-start gap-3">
              {application.status === "PENDING" && <Clock className="mt-0.5 shrink-0 text-yellow-500" size={20} />}
              {application.status === "APPROVED" && (
                <CheckCircle className="mt-0.5 shrink-0 text-green-500" size={20} />
              )}
              {application.status === "REJECTED" && <XCircle className="mt-0.5 shrink-0 text-red-500" size={20} />}
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{application.businessName}</h4>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold ${
                      application.status === "PENDING"
                        ? "border border-yellow-200 bg-yellow-100 text-yellow-700"
                        : application.status === "APPROVED"
                          ? "border border-green-200 bg-green-100 text-green-700"
                          : "border border-red-200 bg-red-100 text-red-700"
                    }`}
                  >
                    {application.status === "PENDING"
                      ? "심사중"
                      : application.status === "APPROVED"
                        ? "승인완료"
                        : "거부됨"}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>사업자 등록번호: {application.businessRegistrationNumber}</p>
                  <p>사업자 구분: {formatBusinessType(application)}</p>
                  <p>대표자: {application.representativeName}</p>
                  <p>연락처: {application.contact}</p>
                  {application.pickupAddress && <p>픽업 주소: {application.pickupAddress}</p>}
                  <p>신청일: {application.createdAt}</p>
                  {application.updatedAt && <p>검토일: {application.updatedAt}</p>}
                  {application.status === "REJECTED" && application.rejectReason && (
                    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
                      <p className="font-medium text-red-700">거부 사유:</p>
                      <p className="text-red-600">{application.rejectReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {applicationHistory?.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>신청 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessApplyHistory;
