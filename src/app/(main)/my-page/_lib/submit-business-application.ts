"use client";

import { postApiUsersBusinessesApplications } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getSession } from "next-auth/react";
import {
  businessApplySchema,
  getBusinessApplicationErrorDetails,
  type BusinessApplicationActionResult,
} from "./business-application";
import { getBusinessDocumentError } from "./business-document";

export async function submitBusinessApplication(formData: FormData): Promise<BusinessApplicationActionResult> {
  try {
    const token = (await getSession())?.accessToken;
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = businessApplySchema.safeParse({
      businessName: formData.get("businessName"),
      contact: formData.get("contact"),
      businessRegistrationNumber: formData.get("businessRegistrationNumber"),
      businessType: formData.get("businessType"),
      pickupAddress: formData.get("pickupAddress"),
      openingDate: formData.get("openingDate"),
      representativeName: formData.get("representativeName"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const document = formData.get("document");
    const documentError = getBusinessDocumentError(document instanceof File ? document : null);
    if (!(document instanceof File) || documentError) {
      return { success: false, error: documentError ?? "사업자 등록증을 첨부해주세요." };
    }

    await postApiUsersBusinessesApplications(
      { document },
      {
        businessName: parsed.data.businessName,
        contact: parsed.data.contact,
        businessRegistrationNumber: parsed.data.businessRegistrationNumber,
        businessType: parsed.data.businessType,
        pickupAddress: parsed.data.pickupAddress || "",
        openingDate: parsed.data.openingDate,
        representativeName: parsed.data.representativeName,
      },
      withToken(token),
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      ...getBusinessApplicationErrorDetails(error),
    };
  }
}
