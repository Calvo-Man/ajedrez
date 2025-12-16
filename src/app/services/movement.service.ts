import { Injectable } from '@angular/core';
import { Piece } from '../interfaces/Piece.interface';
import { HttpClient } from '@angular/common/http';
import { J } from '@angular/cdk/keycodes';
import { Board } from '../interfaces/Board.interface';

@Injectable({
  providedIn: 'root',
})
export class MovementService {
  apiUrl = 'http://localhost:8081';
  constructor(private http: HttpClient) {}

  validateMove(
    from: { row: number; col: number },
    to: { row: number; col: number },
    piece: { type: string; color: 'white' | 'black' }
  ): boolean {
    // Aquí puedes implementar la lógica de validación de movimientos según el tipo de pieza
    // Por simplicidad, este ejemplo permite todos los movimientos
    return true;
  }
  findValidMoves(
    piece: Piece,
    board: Board,
    from: { row: number; col: number }
  ) {
    console.log(
      'Petición enviada al servidor para movimientos válidos',
      piece,
      from,
      board
    );

    return this.http.post<{ row: number; col: number }[]>(
      `${this.apiUrl}/valid-moves`,
      {
        piece,
        board,
        from,
      }
    );
  }
}
