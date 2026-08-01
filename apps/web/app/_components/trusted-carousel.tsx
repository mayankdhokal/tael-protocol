"use client";

import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = Array.from({ length: 4 }, (_, index) => ({
  id: index,
  name: "Gumloop University",
  type: "Customer interview",
}));

export function TrustedCarousel() {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const isDraggingRef = useRef(false);
  const [fadeEdges, setFadeEdges] = useState({ left: false, right: false });
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>("right");
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function updateFadeEdges() {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = row.scrollWidth - row.clientWidth;
    const isAtStart = row.scrollLeft <= 1;
    const isAtEnd = row.scrollLeft >= maxScrollLeft - 1;
    setFadeEdges({
      left: !isAtStart,
      right: !isAtEnd,
    });

    if (isAtStart) {
      setActiveSide("right");
    } else if (isAtEnd) {
      setActiveSide("left");
    } else {
      setActiveSide(null);
    }
  }

  useEffect(() => {
    updateFadeEdges();
    window.addEventListener("resize", updateFadeEdges);

    return () => {
      window.removeEventListener("resize", updateFadeEdges);
    };
  }, []);

  function moveCards(direction: -1 | 1) {
    const row = rowRef.current;
    if (!row) return;

    const firstCard = row.querySelector<HTMLElement>("[data-testimonial-card]");
    const gap = Number.parseFloat(window.getComputedStyle(row.firstElementChild as Element).columnGap);
    const cardStep = firstCard ? firstCard.getBoundingClientRect().width + (Number.isNaN(gap) ? 32 : gap) : 458;

    setActiveSide(null);
    row.scrollBy({ left: cardStep * direction, behavior: "smooth" });
  }

  function stopDragging(pointerId?: number) {
    const row = rowRef.current;
    if (row && pointerId != null && row.hasPointerCapture(pointerId)) {
      row.releasePointerCapture(pointerId);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  }

  const leftActive = activeSide === "left";
  const rightActive = activeSide === "right";
  const leftHighlighted = leftActive || (activeSide === null && hoverSide === "left");
  const rightHighlighted = rightActive || (activeSide === null && hoverSide === "right");

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 md:gap-[72px] md:px-0">
      <div className="flex items-end justify-between gap-4 md:pl-9">
        <h2 className="text-center text-[36px] font-medium leading-[42px] tracking-[-0.035em] text-white md:text-[48px] md:leading-[60px] md:tracking-[-0.0508em]">
          Trusted by
        </h2>

        <div className="flex h-12 shrink-0 items-start gap-1.5 overflow-hidden rounded-[1000px] bg-[#1F1F20] p-1">
          <button
            type="button"
            aria-label="Previous testimonials"
            className={`flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
              leftHighlighted ? "bg-black" : ""
            }`}
            onMouseEnter={() => setHoverSide("left")}
            onMouseLeave={() => setHoverSide(null)}
            onClick={() => moveCards(-1)}
          >
            <img
              src={
                leftHighlighted ? "/testimonial-arrow-active.svg" : "/testimonial-arrow-inactive.svg"
              }
              alt=""
              aria-hidden="true"
              className="size-7"
            />
          </button>
          <button
            type="button"
            aria-label="Next testimonials"
            className={`flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
              rightHighlighted ? "bg-black" : ""
            }`}
            onMouseEnter={() => setHoverSide("right")}
            onMouseLeave={() => setHoverSide(null)}
            onClick={() => moveCards(1)}
          >
            <img
              src={
                rightHighlighted ? "/testimonial-arrow-active.svg" : "/testimonial-arrow-inactive.svg"
              }
              alt=""
              aria-hidden="true"
              className="size-7 rotate-180"
            />
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#141415] to-transparent transition-opacity duration-200 ${
            fadeEdges.left ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#141415] to-transparent transition-opacity duration-200 ${
            fadeEdges.right ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={rowRef}
          className={`marketing-card-scroll w-full overflow-hidden ${isDragging ? "is-dragging" : ""}`}
          onScroll={updateFadeEdges}
          onPointerDown={(event) => {
            if (event.button !== 0 || !rowRef.current) return;

            rowRef.current.setPointerCapture(event.pointerId);
            dragStart.current = {
              x: event.clientX,
              scrollLeft: rowRef.current.scrollLeft,
            };
            isDraggingRef.current = true;
            setIsDragging(true);
          }}
          onPointerMove={(event) => {
            if (!isDraggingRef.current || !rowRef.current) return;

            const deltaX = event.clientX - dragStart.current.x;
            rowRef.current.scrollLeft = dragStart.current.scrollLeft - deltaX;
          }}
          onPointerUp={(event) => stopDragging(event.pointerId)}
          onPointerCancel={(event) => stopDragging(event.pointerId)}
          onLostPointerCapture={() => stopDragging()}
          onDragStart={(event) => event.preventDefault()}
          onWheel={(event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex w-max gap-6 md:gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <article
                key={testimonial.id}
                data-testimonial-card
                className="flex h-[300px] w-[calc(100vw-48px)] max-w-[426px] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] bg-[#1F1F20] p-7 sm:h-[320px] sm:p-9"
              >
                <div className="flex h-12 items-center gap-3">
                  <img
                    src="/testimonial-avatar.png"
                    alt=""
                    aria-hidden="true"
                    className="size-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col gap-1 text-[14px] leading-5">
                    <p className="whitespace-nowrap font-medium text-white">{testimonial.name}</p>
                    <p className="whitespace-nowrap font-normal text-[#C2C2C2]">
                      {testimonial.type}
                    </p>
                  </div>
                </div>

                <p className="h-36 w-full max-w-[292px] text-[14px] font-normal leading-6 text-white">
                  Mintlify for me has been transformational &mdash; I&apos;m a one-man band. Adding
                  a new video or making an update to a course is a two-minute thing. It&apos;s a
                  one-click deploy&hellip; you&apos;re giving me the structure so I know I&apos;m
                  not messing anything up.
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
