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
  imports: [CommonModule, DragDropModule], // 👈 AQUÍ
  standalone: true,
})
export class ChessBoardComponent {
  board: Board = [];
  currentTurn: 'white' | 'black' = 'white';
  validMoves: { row: number; col: number }[] = [];

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

    // 🔒 Regla 1: misma casilla
    if (fromRow === targetRow && fromCol === targetCol) {
      console.log('Movimiento inválido: misma casilla');
      this.dragFrom = null;
      return;
    }

    const piece = this.board[fromRow][fromCol].piece;
    if (!piece) return;

    const targetPiece = this.board[targetRow][targetCol].piece;

    // 🔒 Regla 2: no comer pieza del mismo color
    if (targetPiece && targetPiece.color === piece.color) {
      console.log('Movimiento inválido: pieza del mismo color');
      this.dragFrom = null;
      return;
    }

    // 🔒 Regla 3: movimientos válidos
    this.getValidMoves(
      piece,
      this.board,
      { row: fromRow, col: fromCol }
    );

    const isValidMove = this.validMoves.some(
      (move) => move.row === targetRow && move.col === targetCol
    );

    this.board[targetRow][targetCol].piece = piece;
    this.board[fromRow][fromCol].piece = undefined;

    this.dragFrom = null;
    console.log(this.board);
    // Cambiar turno
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
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
      .subscribe((moves) => {
        this.validMoves = moves;
        console.log('Movimientos válidos recibidos del servidor:', moves);
      });
  }
}
