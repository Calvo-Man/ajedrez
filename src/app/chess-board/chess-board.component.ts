import { DragDropModule } from '@angular/cdk/drag-drop';
import { ContentObserver } from '@angular/cdk/observers';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Piece } from '../interfaces/Piece.interface';

import { MovementService } from '../services/movement.service';
import { Board } from '../interfaces/Board.interface';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.css'],
  imports: [CommonModule, DragDropModule],
  standalone: true,
})
export class ChessBoardComponent {
  board: Board = [];
  currentTurn: 'white' | 'black' = 'white';
  validMoves: { row: number; col: number }[] = [];
  capturedWhite: Piece[] = [];
  capturedBlack: Piece[] = [];
  lastMove: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null = null;
  movingPiece: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null = null;

  constructor(private movementService: MovementService) {
    this.createBoard();
    this.placePieces();
  }

  createBoard() {
    for (let row = 0; row < 8; row++) {
      const currentRow = [];
      for (let col = 0; col < 8; col++) {
        currentRow.push({
          color: (row + col) % 2,
        });
      }
      this.board.push(currentRow);
    }
  }

  placePieces() {
    // Peones
    for (let i = 0; i < 8; i++) {
      this.board[1][i].piece = { type: 'peon', color: 'black' };
      this.board[6][i].piece = { type: 'peon', color: 'white' };
    }

    const backRow = [
      'torre',
      'caballo',
      'alfil',
      'reina',
      'rey',
      'alfil',
      'caballo',
      'torre',
    ];

    backRow.forEach((type, i) => {
      this.board[0][i].piece = { type, color: 'black' };
      this.board[7][i].piece = { type, color: 'white' };
    });
    console.log(this.board);
  }

  getPieceSymbol(piece: Piece): string {
    const symbols: any = {
      white: {
        rey: '♔',
        reina: '♕',
        torre: '♖',
        alfil: '♗',
        caballo: '♘',
        peon: '♙',
      },
      black: {
        rey: '♚',
        reina: '♛',
        torre: '♜',
        alfil: '♝',
        caballo: '♞',
        peon: '♟',
      },
    };

    return symbols[piece.color][piece.type];
  }

  dropPiece(event: any) {
    if (!this.dragFrom) return;

    const cellElement = event.event.target.closest('.cell');
    if (!cellElement) return;

    const targetRow = Number(cellElement.dataset.row);
    const targetCol = Number(cellElement.dataset.col);

    const { row: fromRow, col: fromCol } = this.dragFrom;
    const piece = this.board[fromRow][fromCol].piece;

    if (!piece) return;

    // ❌ Misma casilla
    if (fromRow === targetRow && fromCol === targetCol) {
      this.dragFrom = null;
      this.validMoves = [];
      return;
    }
    
    // ❌ Movimiento no permitido por backend
    // if (!this.isValidCell(targetRow, targetCol)) {
    //   this.dragFrom = null;
    //   this.validMoves = [];
    //   return;
    // }
    
    const targetPiece = this.board[targetRow][targetCol].piece;
    // 🟥 Mismo color
    if (targetPiece && targetPiece.color === piece.color) {
      this.dragFrom = null;
      this.validMoves = [];
      return;
    }
    // 🟢 Preparar animación
    this.movingPiece = {
      from: { row: fromRow, col: fromCol },
      to: { row: targetRow, col: targetCol },
    };

    // 🟥 CAPTURA
    if (targetPiece && targetPiece.color !== piece.color) {
      if (targetPiece.color === 'white') {
        this.capturedWhite.push(targetPiece);
      } else {
        this.capturedBlack.push(targetPiece);
      }

      this.board[targetRow][targetCol].capturing = true;

      setTimeout(() => {
        this.board[targetRow][targetCol].piece = piece;
        this.board[targetRow][targetCol].capturing = false;
        this.board[fromRow][fromCol].piece = undefined;

        this.lastMove = {
          from: { row: fromRow, col: fromCol },
          to: { row: targetRow, col: targetCol },
        };

        this.movingPiece = null;
        this.validMoves = [];
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      }, 300);

      this.dragFrom = null;
      return;
    }

    // 🟦 MOVIMIENTO NORMAL
    setTimeout(() => {
      this.board[targetRow][targetCol].piece = piece;
      this.board[fromRow][fromCol].piece = undefined;

      this.lastMove = {
        from: { row: fromRow, col: fromCol },
        to: { row: targetRow, col: targetCol },
      };

      this.movingPiece = null;
      this.validMoves = [];
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    }, 300);

    this.dragFrom = null;
  }

  dragFrom: { row: number; col: number } | null = null;

  startDrag(row: number, col: number) {
    const piece = this.board[row][col].piece;
    if (!piece) return;

    if (piece.color !== this.currentTurn) {
      console.log('No es el turno de', piece.color);
      return;
    }

    this.dragFrom = { row, col };

    // 🔥 AQUÍ se pide al backend
    this.movementService
      .findValidMoves(piece, this.board, { row, col })
      .subscribe((moves: any) => {
        this.validMoves = moves;
        console.log('Casillas permitidas:', moves);
      });
  }

  getTurnLabel() {
    return this.currentTurn === 'white' ? 'Blancas' : 'Negras';
  }

  getValidMoves(
    piece: Piece,
    board: Board,
    from: { row: number; col: number }
  ) {
    this.movementService
      .findValidMoves(piece, board, from)
      .subscribe((moves: any) => {
        this.validMoves = moves;
        console.log('Movimientos válidos recibidos del servidor:', moves);
      });
  }
  isValidCell(row: number, col: number): boolean {
    return this.validMoves.some((move) => move.row === row && move.col === col);
  }
  isLastMoveCell(row: number, col: number): boolean {
    if (!this.lastMove) return false;

    const { from, to } = this.lastMove;

    return (
      (from.row === row && from.col === col) ||
      (to.row === row && to.col === col)
    );
  }
  getMoveTransform(row: number, col: number): string {
    if (!this.movingPiece) return '';

    const { from, to } = this.movingPiece;

    if (to.row !== row || to.col !== col) return '';

    const dx = (from.col - to.col) * 100;
    const dy = (from.row - to.row) * 100;

    return `translate(${dx}%, ${dy}%)`;
  }
}
