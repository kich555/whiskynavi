"use client";

import type { UserDeliveryAddressResponse, UserSelfResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { createDeliveryAddressFormAction } from "../../../delivery-order/actions";
import {
  type KakaoPostcodeData,
  loadKakaoPostcodeScript,
  resolvePostcodeAddress,
} from "../_lib/kakao-postcode";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: UserSelfResponse | null;
  onAddressCreated: (address: UserDeliveryAddressResponse) => void;
}

export function AddressDialog({
  open,
  onOpenChange,
  currentUser,
  onAddressCreated,
}: AddressDialogProps) {
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isAddressPending, startAddressTransition] = useTransition();
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const handlePostcodeSearch = () => {
    loadKakaoPostcodeScript()
      .then((Postcode) => {
        new Postcode({
          oncomplete: (data: KakaoPostcodeData) => {
            if (postalCodeRef.current) postalCodeRef.current.value = data.zonecode ?? "";
            if (addressRef.current) addressRef.current.value = resolvePostcodeAddress(data);
            addressDetailRef.current?.focus();
          },
        }).open();
      })
      .catch(() => {
        toast.error("주소 검색 서비스를 불러오지 못했습니다.");
      });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressError(null);
    const formData = new FormData(event.currentTarget);

    startAddressTransition(async () => {
      const result = await createDeliveryAddressFormAction({ success: false }, formData);

      if (!result.success) {
        setAddressError(result.error ?? "배송지 저장에 실패했습니다.");
        return;
      }

      onAddressCreated(result.data);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>배송지 추가</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1 text-sm font-medium text-gray-700" htmlFor="addressName" required>
                배송지 이름
              </Label>
              <Input id="addressName" name="addressName" placeholder="집" required />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Checkbox id="defaultAddress" name="defaultAddress" />
              <Label htmlFor="defaultAddress" className="text-sm text-gray-700">
                기본 배송지로 설정
              </Label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label
                className="mb-1 text-sm font-medium text-gray-700"
                htmlFor="addressReceiverName"
                required
              >
                수령인
              </Label>
              <Input
                id="addressReceiverName"
                name="receiverName"
                defaultValue={currentUser?.name ?? ""}
                required
              />
            </div>
            <div>
              <Label
                className="mb-1 text-sm font-medium text-gray-700"
                htmlFor="addressReceiverPhone"
                required
              >
                수령인 연락처
              </Label>
              <Input
                id="addressReceiverPhone"
                name="receiverPhone"
                defaultValue={currentUser?.phone ?? ""}
                placeholder="010-1234-5678"
                required
              />
            </div>
          </div>

          <div className="border-y border-gray-200 py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-500 text-black">
                1
              </span>
              <span className="text-amber-700">주소 검색</span>
              <span className="h-px min-w-8 flex-1 bg-gray-200" aria-hidden="true" />
              <span className="inline-flex h-6 w-6 items-center justify-center bg-gray-100 text-gray-600">
                2
              </span>
              <span className="text-gray-600">상세 주소 입력</span>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePostcodeSearch}
                  className="h-9"
                >
                  <Search aria-hidden="true" />
                  우편번호 검색
                </Button>
                <div>
                  <Label className="mb-1 text-sm font-medium text-gray-700" htmlFor="postalCode">
                    우편번호
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    ref={postalCodeRef}
                    readOnly
                    defaultValue=""
                    placeholder="04524"
                    className="read-only:cursor-default"
                  />
                </div>
              </div>

              <div>
                <Label
                  className="mb-1 text-sm font-medium text-gray-700"
                  htmlFor="address"
                  required
                >
                  기본 주소
                </Label>
                <Input
                  id="address"
                  name="address"
                  ref={addressRef}
                  readOnly
                  defaultValue=""
                  placeholder="서울특별시 중구 ..."
                  className="read-only:cursor-default"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <Label className="mb-1 text-sm font-medium text-gray-700" htmlFor="addressDetail">
                  상세 주소
                </Label>
                <Input
                  id="addressDetail"
                  name="addressDetail"
                  ref={addressDetailRef}
                  defaultValue=""
                  placeholder="101호"
                />
              </div>
            </div>
          </div>

          <div>
            <Label
              className="mb-1 text-sm font-medium text-gray-700"
              htmlFor="addressDeliveryMemo"
            >
              배송 메모
            </Label>
            <Textarea
              id="addressDeliveryMemo"
              name="deliveryMemo"
              defaultValue=""
              placeholder="문 앞에 놓아주세요"
            />
          </div>

          {addressError && <p className="text-sm text-red-600">{addressError}</p>}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={isAddressPending}>
              {isAddressPending ? "저장 중" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
