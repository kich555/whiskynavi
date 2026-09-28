"use client";
import Link from "next/link";
import { useState } from "react";
import type { loadOverview } from "../actions";
import { formatDate } from "../fields";
import OperationButton from "./OperationButton";
import { Badge, DataTable, ErrorPanel, Panel, Shell, buttonClass, inputClass } from "./shared";
type Result = Awaited<ReturnType<typeof loadOverview>>;
export default function Overview({
  result,
  keyword = "",
  page = 0,
}: {
  result: Result;
  section: string;
  keyword?: string;
  page?: number;
}) {
  const [filter, setFilter] = useState("");
  return (
    <Shell title="블라인드 테이스팅">
      {!result.success ? (
        <ErrorPanel error={result.error} />
      ) : (
        <>
          {result.kind === "notices" && (
            <Panel
              title="회차 관리"
              description="리뷰 보틀과 샘플을 준비한 뒤 공고를 구성하세요. 신청 → 수동·자동 배분 → 배송 → 결과 관리 순서로 진행합니다."
              actions={<OperationButton operation="createNotice" label="공고 만들기" />}
            >
              <DataTable
                headers={["공고", "진행 상태", "신청 기간 (한국 시간)", "리뷰 마감", "결과 공개", "관리"]}
                empty={!result.data.length}
              >
                {result.data.map((n) => (
                  <tr key={n.id}>
                    <td className="font-medium">{n.title}</td>
                    <td>
                      <Badge value={n.status} />
                    </td>
                    <td>
                      {formatDate(n.applyOpenAt)}
                      <br />
                      {formatDate(n.applyCloseAt)}
                    </td>
                    <td>{formatDate(n.reviewDeadlineAt)}</td>
                    <td>
                      <Badge value={n.visibility} />
                    </td>
                    <td>
                      <Link className={buttonClass} href={`/admin/blind-tastings/notices/${n.id}`}>
                        회차 관리
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </Panel>
          )}
          {result.kind === "bottles" && (
            <Panel
              title="리뷰 보틀"
              description="판매 상품과 독립된 보틀 목록입니다. 신규 등록은 비공개이며, 공개하면 회원 카탈로그에 노출됩니다."
              actions={
                <>
                  <OperationButton
                    operation="importBottle"
                    label="자사 보틀 가져오기"
                    description="기존 판매 보틀 ID로 정보를 복사합니다. 같은 보틀 연결이 있으면 기존 리뷰 보틀을 사용합니다."
                  />
                  <OperationButton operation="linkBottle" label="기존 보틀 연결" />
                  <OperationButton operation="createBottle" label="보틀 등록" />
                </>
              }
            >
              <form className="flex gap-2">
                <input
                  aria-label="보틀 검색"
                  name="keyword"
                  defaultValue={keyword}
                  placeholder="보틀명 검색"
                  className={inputClass}
                />
                <button className={buttonClass}>검색</button>
              </form>
              <DataTable
                headers={["ID / 보틀명", "브랜드·증류소", "도수", "공개 상태", "관리"]}
                empty={!result.data.length}
              >
                {result.data.map((b) => (
                  <tr key={b.id}>
                    <td>
                      #{b.id} · {b.name}
                    </td>
                    <td>
                      {b.brand || "—"}
                      <br />
                      {b.distillery || "—"}
                    </td>
                    <td>{b.abv ?? "—"}%</td>
                    <td>
                      <Badge value={b.visibility} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <OperationButton
                          operation="editBottle"
                          label="수정"
                          id={b.id}
                          version={b.version}
                          defaults={{ ...b }}
                        />
                        <OperationButton operation="uploadImage" label="이미지 등록" id={b.id} version={b.version} />
                        {b.imageKey && (
                          <a
                            href={`/admin/blind-tastings/files/image/${b.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonClass}
                          >
                            이미지 보기
                          </a>
                        )}
                        {b.visibility !== "PUBLIC" && (
                          <OperationButton
                            operation="publishBottle"
                            label="카탈로그 공개"
                            id={b.id}
                            version={b.version}
                            description="회원이 보틀의 존재와 정보를 볼 수 있게 됩니다. 블라인드 공개 전에는 비공개를 유지하세요."
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
              <div className="flex justify-between">
                <Link
                  aria-disabled={page === 0}
                  className={`${buttonClass} ${page === 0 ? "pointer-events-none opacity-40" : ""}`}
                  href={`?keyword=${encodeURIComponent(keyword)}&page=${page - 1}`}
                >
                  이전
                </Link>
                <span>{page + 1} 페이지</span>
                <Link
                  aria-disabled={result.data.length < 30}
                  className={`${buttonClass} ${result.data.length < 30 ? "pointer-events-none opacity-40" : ""}`}
                  href={`?keyword=${encodeURIComponent(keyword)}&page=${page + 1}`}
                >
                  다음
                </Link>
              </div>
            </Panel>
          )}
          {result.kind === "samples" && (
            <Panel
              title="샘플 관리"
              description="리뷰 보틀에 샘플을 연결합니다. 배분 가능한 수량과 블라인드 코드는 각 공고에서 지정합니다."
              actions={
                <OperationButton
                  operation="createSample"
                  label="샘플 등록"
                  defaults={{ active: true }}
                  choices={{
                    reviewBottleId: result.bottles.map((b) => ({ value: String(b.id), label: `#${b.id} ${b.name}` })),
                  }}
                />
              }
            >
              <DataTable
                headers={["샘플", "리뷰 보틀 ID", "관리자 메모", "사용 여부", "관리"]}
                empty={!result.data.length}
              >
                {result.data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      #{s.id} · {s.name}
                    </td>
                    <td>#{s.reviewBottleId}</td>
                    <td className="max-w-md whitespace-pre-wrap">{s.adminMemo || "—"}</td>
                    <td>{s.active ? "사용" : "중지"}</td>
                    <td>
                      <OperationButton
                        operation="editSample"
                        label="수정"
                        id={s.id}
                        version={s.version}
                        defaults={{ ...s }}
                      />
                    </td>
                  </tr>
                ))}
              </DataTable>
            </Panel>
          )}
          {result.kind === "restrictions" && (
            <Panel
              title="블라인드 참여 제한"
              description="사용자에게 표시할 사유와 내부 메모를 구분합니다. 기존 제한 기간이 있으면 이어서 적용됩니다."
              actions={<OperationButton operation="restrict" label="참여 제한 부여" />}
            >
              <input
                aria-label="제한 검색"
                placeholder="회원 ID 또는 사유 검색"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={inputClass}
              />
              <DataTable
                headers={["회원 / 신청", "제한 사유", "적용 기간", "상태", "내부 메모", "관리"]}
                empty={!result.data.length}
              >
                {result.data
                  .filter((r) => `${r.userId} ${r.userReason}`.includes(filter))
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        회원 #{r.userId}
                        <br />
                        신청 {r.applicationId ? `#${r.applicationId}` : "—"}
                      </td>
                      <td>
                        <Badge value={r.reasonType} />
                        <p className="mt-2">{r.userReason}</p>
                      </td>
                      <td>
                        {formatDate(r.startsAt)}
                        <br />
                        {formatDate(r.endsAt)}
                      </td>
                      <td>
                        <Badge value={r.status} />
                      </td>
                      <td className="max-w-xs whitespace-pre-wrap">{r.internalNote || "—"}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <OperationButton
                            operation="restrictionEdit"
                            label="기간·사유 수정"
                            id={r.id}
                            version={r.version}
                            defaults={{ userReason: r.userReason, internalNote: r.internalNote }}
                            disabled={r.status !== "ACTIVE"}
                          />
                          <OperationButton
                            operation="revokeRestriction"
                            label="제한 해제"
                            id={r.id}
                            version={r.version}
                            disabled={r.status !== "ACTIVE"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </DataTable>
            </Panel>
          )}
          {result.kind === "incidents" && (
            <Panel
              title="배송 사고"
              description="신고 내용과 배송 현황을 확인한 뒤 해결 처리하세요. 재배송 필요로 처리한 경우 회차 배송 화면에서 재배송을 준비해야 합니다."
            >
              <DataTable
                headers={["신청 / 배분", "신고 내용", "접수일", "상태·처리", "관리"]}
                empty={!result.data.length}
              >
                {result.data.map((i) => (
                  <tr key={i.id}>
                    <td>
                      신청 #{i.applicationId}
                      <br />
                      배분 #{i.allocationId}
                    </td>
                    <td className="max-w-lg whitespace-pre-wrap">{i.description}</td>
                    <td>{formatDate(i.createdAt)}</td>
                    <td>
                      <Badge value={i.status} />
                      <p>{i.resolution}</p>
                    </td>
                    <td>
                      <OperationButton
                        operation="resolve"
                        label="사고 해결"
                        id={i.id}
                        version={i.version}
                        disabled={i.status !== "OPEN"}
                      />
                    </td>
                  </tr>
                ))}
              </DataTable>
            </Panel>
          )}
        </>
      )}
    </Shell>
  );
}
