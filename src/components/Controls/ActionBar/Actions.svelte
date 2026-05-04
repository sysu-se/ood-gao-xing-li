<script>
    import { userGrid, canUndo, canRedo, exploreMode } from '@sudoku/stores/grid';
    import { cursor } from '@sudoku/stores/cursor';
    import { candidates } from '@sudoku/stores/candidates';
    import { hints } from '@sudoku/stores/hints';
    import { notes } from '@sudoku/stores/notes';
    import { settings } from '@sudoku/stores/settings';
    import { keyboardDisabled } from '@sudoku/stores/keyboard';
    import { gamePaused } from '@sudoku/stores/game';

    $: hintsAvailable = $hints > 0;

    function handleUndo() {
        userGrid.undo();
    }

    function handleRedo() {
        userGrid.redo();
    }

    function handleHint() {
        if (!hintsAvailable) return;

        const ry = $cursor.y;
        const cx = $cursor.x;

        // 候选提示: cursor on an empty cell → show candidates for the user-selected cell
        if (ry !== null && cx !== null && $userGrid[ry] && $userGrid[ry][cx] === 0) {
            const pos = { x: cx, y: ry };
            const cellCands = userGrid.getCandidates(pos);
            if (cellCands.length > 0) {
                hints.useHint();
                cursor.set(cx, ry);
                candidates.clear(pos);
                cellCands.forEach(c => candidates.add(pos, c));
                return;
            }
            // No valid candidates for cursor cell (board conflict) — fall through to 下一步提示
        }

        // 下一步提示: cursor on filled cell or no cursor → find and auto-fill forced move.
        // Falls back to showing candidates for the best cell when no forced move exists.
        const hint = userGrid.applyHint();
        if (!hint) return;
        cursor.set(hint.col, hint.row);
        if (hint.candidates.length > 1) {
            const pos = { x: hint.col, y: hint.row };
            candidates.clear(pos);
            hint.candidates.forEach(c => candidates.add(pos, c));
        }
    }

    function handleStartExplore() {
        userGrid.startExplore();
    }

    function handleAbandonExplore() {
        userGrid.abandonExplore();
    }

    function handleCommitExplore() {
        userGrid.commitExplore();
    }
</script>

<div class="action-buttons space-x-3">

    <button class="btn btn-round" disabled={$gamePaused || !$canUndo} title="Undo" on:click={handleUndo}>
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    </button>

    <button class="btn btn-round" disabled={$gamePaused || !$canRedo} title="Redo" on:click={handleRedo}>
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
    </button>

    <button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable} on:click={handleHint} title="Hints ({$hints})">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>

        {#if $settings.hintsLimited}
            <span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
        {/if}
    </button>

    <button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
        <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>

        <span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
    </button>

    {#if $exploreMode.active}
        <button class="btn btn-round" disabled={$gamePaused} title="Abandon explore" on:click={handleAbandonExplore}>
            <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <button class="btn btn-round" disabled={$gamePaused} title="Commit explore" on:click={handleCommitExplore}>
            <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </button>
    {:else}
        <button class="btn btn-round" disabled={$gamePaused} title="Enter explore mode" on:click={handleStartExplore}>
            <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        </button>
    {/if}

</div>

<style>
    .action-buttons {
        @apply flex flex-wrap justify-evenly self-end;
    }

    .btn-badge {
        @apply relative;
    }

    .badge {
        min-height: 20px;
        min-width:  20px;
        @apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
    }

    .badge-primary {
        @apply bg-primary;
    }
</style>