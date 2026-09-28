"use client";
import Link from "next/link";
import { useState } from "react";
import type { loadNotice } from "../actions";
import { formatDate, koreaInput } from "../fields";
import OperationButton from "./OperationButton";
import { Badge, DataTable, ErrorPanel, Panel, RawJson, Shell, buttonClass, inputClass } from "./shared";
type Result = Awaited<ReturnType<typeof loadNotice>>;
export default function NoticeDetail({
  result,
  id,
  tab,
  query,
}: {
  result: Result;
  id: number;
  tab: string;
  query: Record<string, string | undefined>;
}) {
  const [search, setSearch] = useState("");
  if (!result.success)
    return (
      <Shell title="회차 관리">
        <ErrorPanel error={result.error} />
      </Shell>
    );
  const now = result.serverTime;
  const n = result.notice;
  const samples = result.samples;
  const path = `/admin/blind-tastings/notices/${id}`;
  const sampleName = (sid?: number) => samples.find((s) => s.id === sid)?.blindCode ?? `#${sid}`;
  const noticeProps = { id, version: n.version };
  return (
    <Shell title={n.title ?? "회차 관리"}>
      <Link href="/admin/blind-tastings" className="typo-medium-14 text-amber-800">
        ← 회차 목록
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <Badge value={n.status} />
        <Badge value={n.visibility} />
        <span className="typo-regular-14 text-gray-600">리뷰 마감 {formatDate(n.reviewDeadlineAt)}</span>
      </div>
      <nav aria-label="회차 작업" className="flex flex-wrap gap-2">
        {[
          ["settings", "공고·샘플"],
          ["applications", "신청·배분"],
          ["shipping", "배송·완료 처리"],
          ["reviews", "리뷰·결과 추출"],
          ["audit", "변경 이력"],
        ].map(([value, label]) => (
          <Link
            key={value}
            aria-current={tab === value ? "page" : undefined}
            className={`${buttonClass} ${tab === value ? "border-amber-600 bg-amber-50" : ""}`}
            href={`${path}?tab=${value}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {result.kind === "settings" && (
        <>
          <Panel
            title="공고 정보"
            description="모든 일시는 한국 시간으로 표시합니다. 최초 발송 후에는 회차를 취소할 수 없습니다."
            actions={
              <>
                <OperationButton
                  operation="editNotice"
                  label="공고 수정"
                  {...noticeProps}
                  defaults={{
                    title: n.title,
                    description: n.description,
                    applyOpenAt: koreaInput(n.applyOpenAt),
                    applyCloseAt: koreaInput(n.applyCloseAt),
                    reviewDeadlineAt: koreaInput(n.reviewDeadlineAt),
                  }}
                  disabled={n.status !== "DRAFT"}
                />
                <OperationButton
                  operation="publishNotice"
                  label="신청 공고 게시"
                  {...noticeProps}
                  disabled={n.status !== "DRAFT"}
                  description="신청 기간에 맞춰 회원에게 공고를 공개합니다. 샘플과 배분 수량을 먼저 확인하세요."
                />
                <OperationButton
                  operation="extend"
                  label="리뷰 마감 연장"
                  {...noticeProps}
                  disabled={n.status === "CANCELLED"}
                />
                <OperationButton
                  operation="cancelNotice"
                  label="회차 취소"
                  {...noticeProps}
                  disabled={!!n.firstShippedAt || n.status === "CANCELLED"}
                />
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["신청 시작", n.applyOpenAt],
                ["신청 마감", n.applyCloseAt],
                ["리뷰 마감", n.reviewDeadlineAt],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-4">
                  <p className="typo-medium-13 mb-2 text-gray-500">{label}</p>
                  <p>{formatDate(value)}</p>
                </div>
              ))}
            </div>
            <p className="typo-regular-14 leading-relaxed whitespace-pre-wrap">{n.description}</p>
          </Panel>
          <Panel
            title="공고 샘플·배분 수량"
            description="수량은 이 공고에서 배분할 수 있는 개수입니다. 최초 발송 이후에는 블라인드 코드를 변경할 수 없습니다."
            actions={
              <OperationButton
                operation="addSample"
                label="샘플 연결"
                {...noticeProps}
                disabled={n.status === "CANCELLED"}
                choices={{
                  sampleId: result.availableSamples
                    .filter((s) => s.active && !samples.some((ns) => ns.sampleId === s.id))
                    .map((s) => ({ value: String(s.id), label: `#${s.id} ${s.name}` })),
                }}
              />
            }
          >
            <DataTable
              headers={["블라인드 코드", "샘플 / 리뷰 보틀", "배분 가능 수량", "보틀 정보", "관리"]}
              empty={!samples.length}
            >
              {samples.map((s) => (
                <tr key={s.id}>
                  <td>{s.blindCode}</td>
                  <td>
                    샘플 #{s.sampleId}
                    <br />
                    보틀 #{s.reviewBottleId}
                  </td>
                  <td>{s.offeredQuantity}개</td>
                  <td>
                    <details>
                      <summary className="cursor-pointer text-amber-800">정체 확인 (관리자)</summary>
                      <RawJson value={s.identityJson} />
                    </details>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <OperationButton
                        operation="editNoticeSample"
                        label="수량·코드 수정"
                        {...noticeProps}
                        context={{ noticeSampleId: s.id }}
                        defaults={{ offeredQuantity: s.offeredQuantity, blindCode: s.blindCode }}
                        disabled={n.status === "CANCELLED"}
                      />
                      <OperationButton
                        operation="unlinkSample"
                        label="연결 해제"
                        {...noticeProps}
                        context={{ noticeSampleId: s.id }}
                        disabled={n.status === "CANCELLED"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </>
      )}
      {result.kind === "applications" && (
        <>
          <Panel
            title="신청자·배분"
            description="신청 시각 순으로 배분합니다. 취소 후 재신청하면 순위가 뒤로 이동합니다. 수동 배분 후 자동 배분을 실행하고, 모집 마감 후 전체 배분을 확정하세요."
            actions={
              <>
                <OperationButton
                  operation="auto"
                  label="선착순 랜덤 배분"
                  {...noticeProps}
                  disabled={!!n.allocationConfirmedAt || n.status !== "PUBLISHED"}
                />
                <OperationButton
                  operation="confirm"
                  label="전체 배분 확정"
                  {...noticeProps}
                  disabled={
                    !!n.allocationConfirmedAt ||
                    n.status === "CANCELLED" ||
                    now < new Date(n.applyCloseAt ?? 0).getTime()
                  }
                  description="배분을 확정하면 참여자에게 배분 정보가 표시됩니다. 배분이 없는 신청은 미배분으로 종료됩니다."
                />
              </>
            }
          >
            <input
              aria-label="신청자 검색"
              className={inputClass}
              placeholder="신청 ID, 회원 ID, 수령인 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <DataTable
              headers={["신청 / 회원", "수령인", "신청 시각 / 시도", "상태", "배분 샘플", "관리"]}
              empty={!result.applications.length}
            >
              {result.applications
                .filter((a) => `${a.id} ${a.userId} ${a.receiverName}`.includes(search))
                .map((a) => {
                  const assigned = result.allocations.filter((x) => x.applicationId === a.id && x.status !== "REVOKED");
                  return (
                    <tr key={a.id}>
                      <td>
                        신청 #{a.id}
                        <br />
                        회원 #{a.userId}
                      </td>
                      <td>{a.receiverName}</td>
                      <td>
                        {formatDate(a.appliedAt)}
                        <br />
                        {a.attempt}회차 신청
                      </td>
                      <td>
                        <Badge value={a.status} />
                      </td>
                      <td>
                        {assigned.map((x) => (
                          <div key={x.id} className="mb-2 flex items-center gap-2">
                            <span>{sampleName(x.noticeSampleId)}</span>
                            <Badge value={x.source} />
                            <OperationButton operation="revoke" label="회수" id={x.id} version={x.version} />
                          </div>
                        ))}
                        {!assigned.length && "—"}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <OperationButton
                            operation="manual"
                            label="수동 배분"
                            {...noticeProps}
                            context={{ applicationId: a.id }}
                            disabled={!["APPLIED", "PARTICIPATING"].includes(a.status ?? "")}
                            choices={{
                              noticeSampleIds: samples
                                .filter((s) => !assigned.some((x) => x.noticeSampleId === s.id))
                                .map((s) => ({
                                  value: String(s.id),
                                  label: `${s.blindCode} (총 ${s.offeredQuantity}개)`,
                                })),
                            }}
                          />
                          <OperationButton
                            operation="restrict"
                            label="참여 제한"
                            context={{ userId: a.userId, applicationId: a.id }}
                          />
                          <Link className={buttonClass} href={`${path}?tab=shipping&application=${a.id}`}>
                            배송·완료 관리
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </DataTable>
          </Panel>
          <Panel title="샘플별 배분 현황">
            <DataTable headers={["코드", "등록 수량", "현재 배분", "잔여"]} empty={!samples.length}>
              {samples.map((s) => {
                const count = result.allocations.filter(
                  (a) => a.noticeSampleId === s.id && a.status !== "REVOKED",
                ).length;
                return (
                  <tr key={s.id}>
                    <td>{s.blindCode}</td>
                    <td>{s.offeredQuantity}</td>
                    <td>{count}</td>
                    <td>{(s.offeredQuantity ?? 0) - count}</td>
                  </tr>
                );
              })}
            </DataTable>
          </Panel>
        </>
      )}
      {result.kind === "shipping" && (
        <>
          <Panel
            title="신청별 배송·완료 관리"
            description="신청자를 선택하면 배송 이력과 배분별 상태를 확인할 수 있습니다. 재배송은 이전 배송 ID와 해당 샘플을 지정하세요."
          >
            <form className="flex gap-2">
              <input type="hidden" name="tab" value="shipping" />
              <select
                name="application"
                aria-label="신청자 선택"
                defaultValue={query.application ?? ""}
                className={inputClass}
                required
              >
                <option value="">신청자를 선택하세요</option>
                {result.applications.map((a) => (
                  <option value={a.id} key={a.id}>
                    신청 #{a.id} · {a.receiverName} (회원 #{a.userId})
                  </option>
                ))}
              </select>
              <button className={buttonClass}>조회</button>
            </form>
          </Panel>
          {result.selected &&
            (() => {
              const a = result.selected;
              const allocs = result.allocations.filter((x) => x.applicationId === a.id && x.status !== "REVOKED");
              return (
                <>
                  <Panel
                    title={`${a.receiverName} · 신청 #${a.id}`}
                    actions={
                      <>
                        <OperationButton
                          operation="address"
                          label="배송지 정정"
                          id={a.id}
                          version={a.version}
                          defaults={{ ...a }}
                        />
                        <OperationButton
                          operation="prepare"
                          label="배송 준비"
                          context={{ applicationId: a.id }}
                          choices={{
                            allocationIds: allocs
                              .filter((x) => x.status === "CONFIRMED")
                              .map((x) => ({
                                value: String(x.id),
                                label: `${sampleName(x.noticeSampleId)} · 배분 #${x.id}`,
                              })),
                          }}
                          disabled={!n.allocationConfirmedAt}
                        />
                        <OperationButton
                          operation="complete"
                          label="수동 완료·면제"
                          id={a.id}
                          version={a.version}
                          description="완료·면제 처리는 실제 리뷰를 만들지 않습니다. 개별 샘플 ID를 비우면 신청 전체에 적용됩니다."
                        />
                        <OperationButton
                          operation="restrict"
                          label="참여 제한"
                          context={{ userId: a.userId, applicationId: a.id }}
                        />
                      </>
                    }
                  >
                    <p className="typo-regular-14 leading-relaxed">
                      {a.receiverPhone} · ({a.postalCode}) {a.address} {a.addressDetail}
                    </p>
                    <DataTable
                      headers={["배분 ID / 코드", "배분 상태", "리뷰 작성 상태", "관리자 완료", "면제"]}
                      empty={!allocs.length}
                    >
                      {allocs.map((x) => (
                        <tr key={x.id}>
                          <td>
                            #{x.id} · {sampleName(x.noticeSampleId)}
                          </td>
                          <td>
                            <Badge value={x.status} />
                          </td>
                          <td>
                            <Badge value={x.writingGate} />
                          </td>
                          <td>{x.adminCompleted ? "완료" : "—"}</td>
                          <td>{x.exempted ? "면제" : "—"}</td>
                        </tr>
                      ))}
                    </DataTable>
                  </Panel>
                  <Panel title="배송 이력">
                    <DataTable
                      headers={["배송 / 재배송 원본", "상태", "택배사·송장", "발송 / 완료", "관리"]}
                      empty={!result.shipments.length}
                    >
                      {result.shipments.map((s) => (
                        <tr key={s.id}>
                          <td>
                            #{s.id}
                            {s.previousShipmentId && <p>이전 #{s.previousShipmentId}</p>}
                          </td>
                          <td>
                            <Badge value={s.status} />
                          </td>
                          <td>
                            {s.carrier || "—"}
                            <br />
                            {s.trackingNumber || "—"}
                          </td>
                          <td>
                            {formatDate(s.dispatchedAt)}
                            <br />
                            {formatDate(s.deliveredAt)}
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <OperationButton
                                operation="dispatch"
                                label="발송 등록"
                                id={s.id}
                                version={s.version}
                                defaults={{ carrier: s.carrier ?? "CJ", trackingNumber: s.trackingNumber }}
                                disabled={s.status !== "PREPARED"}
                              />
                              <OperationButton
                                operation="tracking"
                                label="배송 조회"
                                id={s.id}
                                disabled={s.status !== "DISPATCHED"}
                              />
                              <OperationButton
                                operation="delivered"
                                label="배송 완료 처리"
                                id={s.id}
                                version={s.version}
                                disabled={s.status !== "DISPATCHED"}
                              />
                              <OperationButton
                                operation="prepare"
                                label="재배송 준비"
                                context={{ applicationId: a.id, previousShipmentId: s.id }}
                                choices={{
                                  allocationIds: allocs.map((x) => ({
                                    value: String(x.id),
                                    label: `${sampleName(x.noticeSampleId)} · 배분 #${x.id}`,
                                  })),
                                }}
                                disabled={!["DISPATCHED", "DELIVERED"].includes(s.status ?? "")}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </Panel>
                  <Panel title="수동 완료·면제 이력">
                    <DataTable
                      headers={["처리 ID", "배분 ID", "처리 방식", "처리일", "정정"]}
                      empty={!result.completions.length}
                    >
                      {result.completions.map((c) => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td>#{c.allocationId}</td>
                          <td>
                            <Badge value={c.actionType} />
                          </td>
                          <td>{formatDate(c.createdAt)}</td>
                          <td>
                            {c.active ? (
                              <OperationButton operation="correct" label="처리 정정" id={c.id} version={c.version} />
                            ) : (
                              "정정됨"
                            )}
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </Panel>
                </>
              );
            })()}
        </>
      )}
      {result.kind === "reviews" && (
        <>
          <Panel
            title="결과 현황"
            description="리뷰 양식은 임시 JSON 원문입니다. 점수 집계는 제공하지 않습니다. 공개 후 제출은 블라인드 통계에서 제외됩니다."
            actions={
              <>
                <OperationButton
                  operation="export"
                  label="결과·통계 추출"
                  id={id}
                  defaults={{ format: "CSV", authorMode: "ANONYMOUS" }}
                  description="JSON 원문과 통계를 함께 추출합니다. 기본적으로 숨긴 리뷰와 공개 후 제출은 제외합니다."
                />
                <OperationButton
                  operation="reveal"
                  label="정체·결과 공개"
                  {...noticeProps}
                  disabled={
                    n.visibility === "PUBLIC" ||
                    now < new Date(n.reviewDeadlineAt ?? 0).getTime() ||
                    n.status === "CANCELLED"
                  }
                  description="연결된 보틀 정체와 제출 결과를 회원에게 공개합니다. 이미 알려진 보틀 정보는 결과를 다시 숨겨도 되돌릴 수 없습니다."
                />
                <OperationButton
                  operation="hide"
                  label="결과 비공개"
                  {...noticeProps}
                  disabled={n.visibility !== "PUBLIC"}
                />
              </>
            }
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["실제 제출", result.summary.submittedCount],
                ["통계 포함", result.summary.statisticsCount],
                ["작성 대상", result.summary.requiredCount],
                ["완료·면제 포함", result.summary.completedRequiredCount],
              ].map(([label, count]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-4">
                  <p className="typo-regular-13 text-gray-600">{label}</p>
                  <p className="typo-bold-24 mt-3">{count ?? 0}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="샘플별 리뷰"
            description="샘플을 선택하면 원문·닉네임·메모 검색과 제출 시점·숨김 필터를 사용할 수 있습니다."
          >
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input type="hidden" name="tab" value="reviews" />
              <select
                name="sample"
                aria-label="리뷰 샘플"
                defaultValue={query.sample ?? String(samples[0]?.id ?? "")}
                className={inputClass}
              >
                <option value="" disabled>
                  샘플 선택
                </option>
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.blindCode}
                  </option>
                ))}
              </select>
              <input
                aria-label="리뷰 검색"
                name="keyword"
                defaultValue={query.keyword}
                placeholder="원문·닉네임·메모 검색"
                className={inputClass}
              />
              <select aria-label="제출 시점" name="timing" defaultValue={query.timing ?? ""} className={inputClass}>
                <option value="">모든 제출 시점</option>
                <option value="ON_TIME">기한 내</option>
                <option value="LATE_PRE_REVEAL">지연</option>
                <option value="POST_REVEAL">공개 후</option>
              </select>
              <select aria-label="숨김 상태" name="hidden" defaultValue={query.hidden ?? ""} className={inputClass}>
                <option value="">전체 노출 상태</option>
                <option value="true">숨김</option>
                <option value="false">노출</option>
              </select>
              <button className={buttonClass}>조회</button>
            </form>
            <DataTable
              headers={["샘플 / 작성자", "제출 시각·분류", "리뷰 JSON 원문", "통계·노출", "정리·관리"]}
              empty={!result.reviews.length}
            >
              {result.reviews.map((entry) => {
                const r = entry.review!;
                let annotation: Record<string, unknown> = {};
                try {
                  annotation = JSON.parse(r.annotationJson ?? "{}");
                } catch {}
                return (
                  <tr key={r.id}>
                    <td>
                      {entry.blindCode}
                      <br />
                      {entry.nickname || `회원 #${r.authorUserId}`}
                    </td>
                    <td>
                      {formatDate(r.submittedAt)}
                      <br />
                      <Badge value={entry.context?.timing} />
                    </td>
                    <td className="w-2/5 min-w-72">
                      <RawJson value={r.answersJson} />
                    </td>
                    <td>
                      {entry.statisticsEligible ? "통계 포함" : "통계 제외"}
                      <br />
                      {r.hidden ? "숨김" : "노출"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <OperationButton
                          operation="annotate"
                          label="메모·태그"
                          id={r.id}
                          version={r.version}
                          defaults={{
                            tags: Array.isArray(annotation.tags) ? annotation.tags.join(", ") : "",
                            memo: typeof annotation.memo === "string" ? annotation.memo : "",
                            starred: annotation.starred === true,
                            read: annotation.read === true,
                          }}
                        />
                        <OperationButton
                          operation="moderate"
                          label="노출·통계 관리"
                          id={r.id}
                          version={r.version}
                          defaults={{
                            hidden: r.hidden,
                            includeHiddenInStatistics: r.includeHiddenInStatistics,
                            userReason: r.userReason,
                            internalNote: r.internalNote,
                          }}
                        />
                        <OperationButton
                          operation="restrict"
                          label="참여 제한"
                          context={{ userId: r.authorUserId, applicationId: entry.allocation?.applicationId }}
                        />
                      </div>
                      <p className="typo-regular-13 mt-3 leading-relaxed whitespace-pre-wrap">
                        {typeof annotation.memo === "string" ? annotation.memo : ""}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </Panel>
          <Panel title="샘플별 작성 현황">
            <DataTable
              headers={["작성자", "코드", "실제 제출", "완료 상태", "배송·완료 관리"]}
              empty={!result.reviewStatus.length}
            >
              {result.reviewStatus.map((s) => (
                <tr key={s.allocation?.id}>
                  <td>{s.nickname}</td>
                  <td>{s.blindCode}</td>
                  <td>{s.submitted ? "제출" : "미제출"}</td>
                  <td>{s.complete ? "완료" : "미완료"}</td>
                  <td>
                    <Link
                      className={buttonClass}
                      href={`${path}?tab=shipping&application=${s.allocation?.applicationId}`}
                    >
                      신청 관리
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </>
      )}
      {result.kind === "audit" && (
        <Panel title="변경 이력" description="신청·배분·배송·관리자 처리 이력을 확인합니다.">
          <DataTable headers={["시각", "처리자", "작업", "대상", "사유·상세"]} empty={!result.audits.length}>
            {result.audits.map((a) => (
              <tr key={a.id}>
                <td>{formatDate(a.createdAt)}</td>
                <td>#{a.createdBy}</td>
                <td>{a.action}</td>
                <td>
                  {a.targetType} #{a.targetId}
                </td>
                <td>
                  {a.reason}
                  <details>
                    <summary>상세</summary>
                    <RawJson value={a.detailsJson} />
                  </details>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </Shell>
  );
}
